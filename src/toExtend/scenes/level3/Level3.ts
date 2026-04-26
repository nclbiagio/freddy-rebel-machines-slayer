import { BaseScene } from '../../../scenes/_template/BaseScene';
import { GameSceneTypes } from '../../../GameService';
import { FreddyEntity } from '../../../entities/FreddyEntity';
import { MagnetGunEntity } from '../../../entities/MagnetGunEntity';
import { Level3CollisionService } from './Level3Collision';
import { ExcavatorEntity } from '../../../entities/ExcavatorEntity';
import { handleMachineInteractions } from '../../SceneUtils';
import { createPlayer } from '../../../game/factories/PlayerFactory';
import { EventBus } from '../../../EventBus';
import { LevelCompleteScene } from '../levelComplete/LevelComplete';
import { createCablesGroup } from '../../games/freddyRebelMachinesSlayer/CableFactory';
import { createMachinesGroup } from '../../games/freddyRebelMachinesSlayer/MachineFactory';
import { MusicTracker } from '../../../core/audio/MusicTracker';
import { LevelStore } from '../../../game/state/LevelStore';
import { MessageUtils } from '../../../message/Message';
import { ExplosionService } from '../../../core/graphics/Explosion';

export type ObjectLayersTypes = 'Player' | 'Cables' | 'Machines';
export type TileLayersTypes = 'Ground';

export const TILED_WIDTH = 1216;
export const TILED_HEIGHT = 640;

export class Level3Scene extends BaseScene<TileLayersTypes, ObjectLayersTypes> {
   static sceneKey: GameSceneTypes = 'Level3';

   #collisionService!: Level3CollisionService;
   private magnetBullets!: Phaser.GameObjects.Group;
   private cables!: Phaser.GameObjects.Group;
   private machines!: Phaser.GameObjects.Group;
   #musicTracker = new MusicTracker(this, Level3Scene.sceneKey, 'level3');
   #musicCleanup: (() => void) | null = null;
   public introTimer: Phaser.Time.TimerEvent | null = null;
   #levelCompleted: boolean = false;
   #gameOverTriggered: boolean = false;
   private excavator!: ExcavatorEntity;
   public explosions!: ExplosionService;

   declare player: FreddyEntity;

   constructor() {
      super(Level3Scene.sceneKey);
   }

   protected onInit(): void {
      console.log(`Init ${Level3Scene.sceneKey}`);
      this.gameService.scene$.next(Level3Scene.sceneKey);
   }

   protected onResumeHook(scene: GameSceneTypes, data?: { resumeFrom: GameSceneTypes; action?: string }): void {
      if (data?.resumeFrom === 'LevelComplete') {
         this.changeScene(Level3Scene.sceneKey, 'MapScene', 'stop&start');
      }
   }

   create() {
      // Setup Layer Piastrelle
      this.createTileLayers(
         Level3Scene.sceneKey,
         {
            Ground: [
               { tilesetName: 'ground', imageKey: 'ground_mine', collisions: true },
               { tilesetName: 'tile_mine_hazard', imageKey: 'tile_mine_hazard', collisions: true },
            ],
         },
         ['Ground']
      );

      // Sfondo Parallax Miniera a cielo aperto
      this.createParallaxBackgrounds([
         { key: 'bg_mine_sky', scrollFactor: 0, depth: -120 },
         { key: 'bg_mine_clouds', scrollFactor: 0.05, depth: -110 },
         { key: 'bg_mine_far', scrollFactor: 0.2, depth: -100 },
         { key: 'bg_mine_mid', scrollFactor: 0.5, depth: -50 },
         { key: 'bg_mine_near', scrollFactor: 0.8, depth: -10 },
      ]);
      this.createObjectsLayers(['Player', 'Cables', 'Machines']);

      // Player
      this.player = createPlayer(this, FreddyEntity.create, this.objectLayers?.Player?.objects[0], undefined, TILED_WIDTH, TILED_HEIGHT, {
         enableShadow: false,
         enableExperienceEncrease: false,
      });

      // Arma
      const magnetGun = MagnetGunEntity.create(
         this,
         { x: this.player.x, y: this.player.y },
         {
            magnetRange: 300, // Più gittata per la miniera
         }
      );
      this.player.equipWeapon(magnetGun);
      if (this.tileLayers?.Ground) {
         magnetGun.setCollisionLayer(this.tileLayers.Ground);
      }

      // Gruppi
      this.magnetBullets = this.createBullets(5, 'magnet');
      this.magnetBullets.runChildUpdate = true;

      // Creiamo i cavi (ne vogliamo 4)
      this.cables = createCablesGroup(this, this.objectLayers?.Cables);

      // Creiamo le macchine da Tiled
      this.machines = createMachinesGroup(this, this.objectLayers?.Machines);

      // Troviamo l'escavatore ribelle nel gruppo per il riferimento (usato nella cinematic)
      // Lo riconosciamo perché ha dei socket configurati
      this.excavator = this.machines.children.entries.find((m) => m instanceof ExcavatorEntity && m.sockets.length > 0) as ExcavatorEntity;

      if (this.excavator) {
         this.excavator.setModel({
            activeSequence: [
               { socketId: 1, color: 'blue' },
               { socketId: 2, color: 'red' },
               { socketId: 3, color: 'yellow' },
               { socketId: 4, color: 'green' },
            ],
            flashInterval: 500,
         });
      }

      // Fallback se non presente in mappa per evitare crash (anche se dovrebbe esserci)
      if (!this.excavator) {
         console.warn('Excavator not found in Tiled map, creating fallback at 500, 480');
         this.excavator = ExcavatorEntity.createExcavator(
            this,
            { x: 500, y: 480 },
            {
               activeSequence: [
                  { socketId: 1, color: 'blue' },
                  { socketId: 2, color: 'red' },
                  { socketId: 3, color: 'yellow' },
                  { socketId: 4, color: 'green' },
               ],
               flashInterval: 500,
            }
         );
         this.machines.add(this.excavator);
      }

      // Setup Esplosioni
      this.explosions = ExplosionService.getInstance(this, Level3Scene.sceneKey);
      this.explosions.setupVolcanic();

      this.createPhysicsColliders();
      this.physics.world.setBounds(0, 0, TILED_WIDTH, TILED_HEIGHT);
      this.createCamera();

      this.playIntro();

      // Listener Vittoria
      const onMachineSolved = () => {
         if (this.#levelCompleted) return;
         this.#levelCompleted = true;
         // Invece della schermata punteggi standard, andiamo al finale cinematografico
         if (this.#musicCleanup) {
            this.#musicCleanup();
            this.#musicCleanup = null;
         }
         this.changeScene(Level3Scene.sceneKey, 'EndingScene', 'stop&start');
      };

      EventBus.on('machine-solved', onMachineSolved);
      this.#musicCleanup = this.#musicTracker.initSceneSoundTrackEvents();

      this.events.once('shutdown', () => {
         EventBus.off('machine-solved', onMachineSolved);
         if (this.#musicCleanup) this.#musicCleanup();
      });
   }

   private playIntro() {
      const levelStore = LevelStore.getInstance();
      levelStore.setLevelStore(Level3Scene.sceneKey, { others: { isCinematicPlaying: true } });

      MessageUtils.getInstance().addFlyMessage({
         key: 'scene_sequence_lv3',
         text: '🚜 REBEL EXCAVATOR DETECTED',
         duration: 3000,
      });

      this.introTimer = this.time.delayedCall(1000, () => {
         this.cameras.main.stopFollow();
         this.cameras.main.pan(this.excavator.x, this.excavator.y, 2000, 'Power2');

         this.cameras.main.once('camerapancomplete', () => {
            this.excavator.revealSequence();
            this.time.delayedCall(3000, () => {
               if (this.player) {
                  this.cameras.main.pan(this.player.x, this.player.y, 1500, 'Power2');
                  this.cameras.main.once('camerapancomplete', () => {
                     this.cameras.main.startFollow(this.player, true, 0.5, 0.5);
                     levelStore.setLevelStore(Level3Scene.sceneKey, { others: { isCinematicPlaying: false } });
                     this.startChallenge();
                  });
               }
            });
         });
      });
   }

   public startChallenge() {
      MessageUtils.getInstance().addFlyMessage({
         key: 'scene_rocks_falling_warning',
         text: 'It looks like huge rocks are raining from the sky, better stay under an umbrella!!',
      });
      MessageUtils.getInstance().addFlyMessage({
         key: 'scene_excavator_warning',
         text: 'Watch out for that mechanical arm! It looks heavy...',
      });

      // ATTIVAZIONE RIBELLIONE
      if (this.excavator) {
         this.excavator.setModel({ isRebellious: true });
      }
   }

   createPhysicsColliders(): void {
      if (this.tileLayers?.Ground) {
         this.#collisionService = new Level3CollisionService(this, {
            player: this.player,
            groundLayer: this.tileLayers.Ground,
            cables: this.cables,
            playerBullets: this.magnetBullets,
            machines: this.machines,
            volcanicRocks: this.excavator?.volcanicRocks || undefined,
         });
         this.#collisionService.init();
      }
   }

   override update(time: number): void {
      if (this.player) {
         if (this.player.model.status === 'dead' && !this.#gameOverTriggered) {
            this.#gameOverTriggered = true;
            this.startGameOverScene();
         }
      }

      const isCinematicPlaying = LevelStore.getInstance().dataLevel[Level3Scene.sceneKey]?.others?.isCinematicPlaying;

      // Aggiorniamo TUTTE le macchine nel gruppo (incluso l'escavatore ribelle principale e quelli decorativi)
      // Questo assicura che il braccio meccanico sia sempre attaccato al corpo.
      this.machines.children.entries.forEach((m) => {
         if (m instanceof ExcavatorEntity) {
            m.updateExcavator(time, this.player);
         }
      });

      if (this.player && !isCinematicPlaying) {
         this.player.update(time);

         this.machines.children.entries.forEach((m) => {
            (m as any).checkPlayerProximity(this.player);
         });

         const interacted = handleMachineInteractions(this, this.player as FreddyEntity, this.machines);

         if (!interacted && !this.player.heldCable && this.player.model.hasWeapon && this.player.model.canShoot) {
            this.player.magnetGun?.fireBullet(this.magnetBullets);
            this.player.setModel({ canShoot: false });
         }
      }

      this.cables.children.entries.forEach((c) => (c as any).update(time));
   }
}
