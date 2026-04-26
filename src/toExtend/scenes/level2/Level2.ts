import { BaseScene } from '../../../scenes/_template/BaseScene';
import { GameSceneTypes } from '../../../GameService';
import { FreddyEntity } from '../../../entities/FreddyEntity';
import { MagnetGunEntity } from '../../../entities/MagnetGunEntity';
import { Level2CollisionService } from './Level2Collision';
import { CableEntity } from '../../../entities/CableEntity';
import { MachineEntity } from '../../../entities/MachineEntity';
import { handleMachineInteractions } from '../../SceneUtils';
import { createPlayer } from '../../../game/factories/PlayerFactory';
import { playLevel2Intro } from './CinematicUtils';
import { EventBus } from '../../../EventBus';
import { LevelCompleteScene } from '../levelComplete/LevelComplete';
import { MainframeEntity } from '../../../entities/MainframeEntity';
import { createCablesGroup } from '../../games/freddyRebelMachinesSlayer/CableFactory';
import { createBouncyGooGroup } from '../../games/freddyRebelMachinesSlayer/BouncyGooFactory';
import { BouncyGoo } from '../../../entities/BouncyGoo';
import { MusicTracker } from '../../../core/audio/MusicTracker';
import { createMachinesGroup } from '../../games/freddyRebelMachinesSlayer/MachineFactory';
import { ExplosionService } from '../../../core/graphics/Explosion';

export type ObjectLayersTypes = 'Player' | 'Cables' | 'BouncyGoos' | 'Machines';
export type TileLayersTypes = 'Ground';

export const TILED_WIDTH = 640;
export const TILED_HEIGHT = 640;

export class Level2Scene extends BaseScene<TileLayersTypes, ObjectLayersTypes> {
   static sceneKey: GameSceneTypes = 'Level2';

   #collisionService!: Level2CollisionService;
   private magnetBullets!: Phaser.GameObjects.Group;
   private cables!: Phaser.GameObjects.Group;
   private machines!: Phaser.GameObjects.Group;
   #musicTracker = new MusicTracker(this, Level2Scene.sceneKey, 'level2');
   #musicCleanup: (() => void) | null = null;
   private bouncyGoos!: Phaser.GameObjects.Group;
   public introTimer: Phaser.Time.TimerEvent | null = null;
   #levelCompleted: boolean = false;
   #gameOverTriggered: boolean = false;

   declare player: FreddyEntity;

   constructor() {
      super(Level2Scene.sceneKey);
   }

   protected onInit(): void {
      console.log(`Init ${Level2Scene.sceneKey}`);
      this.gameService.scene$.next(Level2Scene.sceneKey);
   }

   protected onResumeHook(scene: GameSceneTypes, data?: { resumeFrom: GameSceneTypes; action?: string }): void {
      if (data?.resumeFrom === 'LevelComplete') {
         console.log('[Level2] Level completed. Returning to MapScene.');
         if (this.#musicCleanup) {
            this.#musicCleanup();
            this.#musicCleanup = null;
         }
         this.changeScene(Level2Scene.sceneKey, 'MapScene', 'stop&start');
      }
   }

   preload() {
      // Carichiamo gli asset specifici del livello
      BouncyGoo.loadSpritesheet(this);
   }

   create() {
      // Setup Layer Piastrelle (Usiamo i nuovi tile chimici se configurati, altrimenti ground)
      this.createTileLayers(
         Level2Scene.sceneKey,
         {
            Ground: [
               { tilesetName: 'ground', imageKey: 'ground_chemical', collisions: true },
               { tilesetName: 'tile_acid_animated', imageKey: 'tile_acid_animated', collisions: true },
            ],
         },
         ['Ground']
      );

      // Sfondo Centrale Chimica (Multi-layered Parallax)
      this.createParallaxBackgrounds([
         { key: 'bg_chemical_far', scrollFactor: 0.2, depth: -100 },
         { key: 'bg_chemical_mid', scrollFactor: 0.5, depth: -50 },
         { key: 'bg_chemical_near', scrollFactor: 0.8, depth: -10 },
      ]);
      this.createObjectsLayers(['Player', 'Cables', 'BouncyGoos', 'Machines']);

      // Player
      this.player = createPlayer(this, FreddyEntity.create, this.objectLayers?.Player?.objects[0], undefined, TILED_WIDTH, TILED_HEIGHT, {
         enableShadow: false,
         enableExperienceEncrease: false,
      });

      // Arma con gittata specifica per il Livello 2
      const magnetGun = MagnetGunEntity.create(
         this,
         { x: this.player.x, y: this.player.y },
         {
            magnetRange: 250,
         }
      );
      this.player.equipWeapon(magnetGun);
      if (this.tileLayers?.Ground) {
         magnetGun.setCollisionLayer(this.tileLayers.Ground);
      }

      // Gruppi
      // runChildUpdate: true permette a Phaser di chiamare automaticamente .update() su ogni proiettile
      this.magnetBullets = this.createBullets(5, 'magnet');
      this.magnetBullets.runChildUpdate = true;
      this.cables = createCablesGroup(this, this.objectLayers?.Cables);
      this.machines = createMachinesGroup(this, this.objectLayers?.Machines);
      this.bouncyGoos = createBouncyGooGroup(this, this.objectLayers?.BouncyGoos);

      this.createPhysicsColliders();
      this.createCamera();
      
      // Setup esplosioni per il livello (incluso l'acido del Mainframe)
      const explosions = ExplosionService.getInstance(this, 'Level2');
      explosions.setupAcid();
      
      // Intro cinematica specifica per il Mainframe (se presente)
      const mainframe = this.machines.getChildren().find((m) => m instanceof MainframeEntity) as MainframeEntity;
      if (mainframe) {
         // Attiviamo la ribellione acida per il Livello 2
         mainframe.setModel({ 
            isRebellious: true,
            chaosSpeed: 200,
            proximityDistance: 250 // Rilevamento più ampio essendo sospeso
         });
         playLevel2Intro(this, mainframe);
      }

      // Listener Vittoria
      const onMachineSolved = () => {
         if (this.#levelCompleted) return;
         this.#levelCompleted = true;

         const currentStats = this.levelStore.dataLevel[Level2Scene.sceneKey] || {};

         this.levelStore.setLevelStore(Level2Scene.sceneKey, {
            ...currentStats,
            completed: true,
         });

         this.changeScene(Level2Scene.sceneKey, LevelCompleteScene.sceneKey, 'pause&resume');
      };

      EventBus.on('machine-solved', onMachineSolved);
      this.#musicCleanup = this.#musicTracker.initSceneSoundTrackEvents();

      this.events.once('shutdown', () => {
         EventBus.off('machine-solved', onMachineSolved);
         if (this.#musicCleanup) {
            this.#musicCleanup();
         }
      });
   }

   public startChallenge() {
      // Messaggi di introduzione del livello (post-cinematic)
      this.messageUtils.addFlyMessage({
         key: 'scene_goo_hint',
         text: "Disgusting radioactive jelly... let's try jumping on it!",
      });

      this.messageUtils.addFlyMessage({
         key: 'scene_acid_warning',
         text: "I'm starting to get thirsty, but I'd better not drink that fluorescent acid sludge!",
      });
   }

   createPhysicsColliders(): void {
      if (this.tileLayers?.Ground) {
         this.#collisionService = new Level2CollisionService(this, {
            player: this.player,
            groundLayer: this.tileLayers.Ground,
            cables: this.cables,
            playerBullets: this.magnetBullets,
            machines: this.machines,
            bouncyGoos: this.bouncyGoos,
         });

         this.#collisionService.addCallback('getSceneData', () => {
            return this.levelStore.dataLevel[Level2Scene.sceneKey];
         });

         this.#collisionService.init();
      }
   }

   override update(time: number): void {
      if (this.player) {
         // --- LOGICA DI MORTE / GAME OVER ---
         if (this.player.model.status === 'dead' && !this.#gameOverTriggered) {
            this.#gameOverTriggered = true;
            this.startGameOverScene();
         }
      }

      const isCinematicPlaying = this.levelStore.dataLevel[Level2Scene.sceneKey]?.others?.isCinematicPlaying;

      if (this.player) {
         if (isCinematicPlaying) {
            this.player.update(time);
            this.player.body.setVelocity(0);
         } else {
            this.player.update(time);

            this.machines.children.entries.forEach((m) => {
               (m as MachineEntity).checkPlayerProximity(this.player);
            });

            const interacted = handleMachineInteractions(this, this.player as FreddyEntity, this.machines);

            if (!interacted && !this.player.heldCable && this.player.model.hasWeapon && this.player.model.canShoot) {
               this.player.magnetGun?.fireBullet(this.magnetBullets);
               this.player.setModel({ canShoot: false });
            }
         }
      }

      this.cables.children.entries.forEach((c) => (c as any).update(time));
      this.machines.children.entries.forEach((m) => {
         (m as MachineEntity).update();
      });
   }
}
