import { BaseScene } from '../../../scenes/_template/BaseScene';
import { GameSceneTypes } from '../../../GameService';
import { FreddyEntity } from '../../../entities/FreddyEntity';
import { MagnetGunEntity } from '../../../entities/MagnetGunEntity';
import { Level1CollisionService } from './Level1Collision';
import { CableEntity } from '../../../entities/CableEntity';
import { MachineEntity } from '../../../entities/MachineEntity';
import { handleMachineInteractions } from '../../SceneUtils';
import { createPlayer } from '../../../game/factories/PlayerFactory';
import { playLevel1Intro } from './CinematicUtils';
import { EventBus } from '../../../EventBus';
import { LevelCompleteScene } from '../levelComplete/LevelComplete';
import { CarEntity } from '../../../entities/CarEntity';
import { createCablesGroup } from '../../games/freddyRebelMachinesSlayer/CableFactory';
import { CarLift } from '../../../entities/CarLift';
import { MusicTracker } from '../../../core/audio/MusicTracker';
import { createMachinesGroup } from '../../games/freddyRebelMachinesSlayer/MachineFactory';

export type ObjectLayersTypes = 'Player' | 'Cables' | 'Machines';
export type TileLayersTypes = 'Ground';

export const TILED_WIDTH = 640;
export const TILED_HEIGHT = 640;

export class Level1Scene extends BaseScene<TileLayersTypes, ObjectLayersTypes> {
   static sceneKey: GameSceneTypes = 'Level1';

   #collisionService!: Level1CollisionService;
   #levelCompleted: boolean = false;
   #gameOverTriggered: boolean = false;
   private magnetBullets!: Phaser.GameObjects.Group;
   private cables!: Phaser.GameObjects.Group;
   private machines!: Phaser.GameObjects.Group;
   private carLifts!: Phaser.GameObjects.Group;
   public introTimer: Phaser.Time.TimerEvent | null = null;
   #musicTracker = new MusicTracker(this, Level1Scene.sceneKey, 'level1');
   #musicCleanup: (() => void) | null = null;

   declare player: FreddyEntity;

   constructor() {
      super(Level1Scene.sceneKey);
   }

   protected onInit(): void {
      console.log(`Init ${Level1Scene.sceneKey}`);
      this.gameService.scene$.next(Level1Scene.sceneKey);
   }

   protected onResumeHook(scene: GameSceneTypes, data?: { resumeFrom: GameSceneTypes; action?: string }): void {
      if (scene === 'Inventory') {
      }

      if (data?.resumeFrom === 'LevelComplete') {
         console.log('[Level1] Level completed. Returning to MapScene.');
         if (this.#musicCleanup) {
            this.#musicCleanup();
            this.#musicCleanup = null;
         }
         this.changeScene(Level1Scene.sceneKey, 'MapScene', 'stop&start');
      }
   }

   create() {
      this.createTileLayers(
         Level1Scene.sceneKey,
         {
            Ground: { tilesetName: 'ground', imageKey: 'ground', collisions: true },
         },
         ['Ground']
      );
      // Sfondo Garage (Multi-layered Parallax)
      this.createParallaxBackgrounds([
         { key: 'bg_garage_far', scrollFactor: 0.2, depth: -100 },
         { key: 'bg_garage_mid', scrollFactor: 0.5, depth: -50 },
         { key: 'bg_garage_near', scrollFactor: 0.8, depth: -10 },
      ]);
      this.createObjectsLayers(['Player', 'Cables', 'Machines']);

      // Instanziamo il nuovo Player usando la Factory generica
      this.player = createPlayer(this, FreddyEntity.create, this.objectLayers?.Player?.objects[0], undefined, TILED_WIDTH, TILED_HEIGHT, {
         enableShadow: false,
         enableExperienceEncrease: false,
      });

      // Istanziamo la nuova arma calamita con gittata specifica per il livello
      const magnetGun = MagnetGunEntity.create(
         this,
         { x: this.player.x, y: this.player.y },
         {
            magnetRange: 200,
         }
      );
      this.player.equipWeapon(magnetGun);
      if (this.tileLayers?.Ground) {
         magnetGun.setCollisionLayer(this.tileLayers.Ground);
      }

      // Gruppi per proiettili e cavi
      // runChildUpdate: true permetterà a Phaser di chiamare automaticamente update() su ogni magnete attivo
      this.magnetBullets = this.createBullets(5, 'magnet');
      this.magnetBullets.runChildUpdate = true;

      this.cables = createCablesGroup(this, this.objectLayers?.Cables);
      this.machines = createMachinesGroup(this, this.objectLayers?.Machines);

      // --- ATTIVAZIONE RIBELLIONE (Pattern: Avanti/Indietro + Impennata) ---
      this.machines.getChildren().forEach((m) => {
         const machine = m as MachineEntity;
         machine.setModel({
            isRebellious: true,
            chaosSpeed: 220, // Velocità della macchina ribelle
         });
      });

      this.carLifts = this.add.group();

      // --- PIATTAFORME: CAR LIFTS ---
      // Distribuite tra il player (x=32) e l'auto (x=550) per favorire il salto verso i cavi (y=130-160)
      const lift1 = CarLift.create(this, { x: 220, y: 483, initialState: 'waiting_down' });
      const lift2 = CarLift.create(this, { x: 420, y: 355, initialState: 'waiting_up' });

      this.carLifts.add(lift1);
      this.carLifts.add(lift2);

      this.createPhysicsColliders();
      this.createCamera();

      // Avvio cinematica intro focalizzata sull'auto (se presente)
      const car = this.machines.getChildren().find((m) => m instanceof CarEntity);
      if (car) {
         playLevel1Intro(this, car as CarEntity);
      }

      // Il timer ora viene avviato solo al termine della cinematica intro

      // Listener Vittoria
      const onMachineSolved = () => {
         if (this.#levelCompleted) return;
         this.#levelCompleted = true;

         // Salvataggio statistiche
         const currentStats = this.levelStore.dataLevel[Level1Scene.sceneKey] || {};
         const bestTime = currentStats.timeBest || Infinity;

         this.levelStore.setLevelStore(Level1Scene.sceneKey, {
            ...currentStats,
            completed: true,
         });

         // Lancio schermata vittoria
         this.changeScene(Level1Scene.sceneKey, LevelCompleteScene.sceneKey, 'pause&resume');
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
      // Messaggio di avvertimento all'inizio del gioco (post-cinematic)
      this.messageUtils.addFlyMessage({ 
         key: 'scene_carlift_warning', 
         text: "Those lifts look dangerous... I'd better not stand under them!" 
      });
   }

   createPhysicsColliders(): void {
      if (this.tileLayers?.Ground) {
         this.#collisionService = new Level1CollisionService(this, {
            player: this.player,
            groundLayer: this.tileLayers.Ground,
            cables: this.cables,
            playerBullets: this.magnetBullets,
            machines: this.machines,
            carLifts: this.carLifts,
         });

         this.#collisionService.init();
         //this.registerCollisionCallbacks();
      }
   }

   override update(time: number): void {
      // Blocco Input durante Cinematic (solo per il player)
      const isCinematicPlaying = this.levelStore.dataLevel[Level1Scene.sceneKey]?.others?.isCinematicPlaying;

      if (this.player) {
         // --- LOGICA DI MORTE / GAME OVER ---
         if ((this.player.model.status === 'dead' || this.player.model.status === 'crushed') && !this.#gameOverTriggered) {
            this.#gameOverTriggered = true;
            this.startGameOverScene();
         }

         if (isCinematicPlaying) {
            this.player.update(time);
            this.player.body.setVelocity(0); // Forza stop
         } else {
            this.player.update(time);

            // Aggiorniamo la vicinanza PRIMA di gestire i click
            this.machines.children.entries.forEach((m) => {
               (m as MachineEntity).checkPlayerProximity(this.player);
            });

            // 1. Logica di Interazione contestuale (Priorità)
            const interacted = handleMachineInteractions(this, this.player as FreddyEntity, this.machines);

            // 2. Logica di sparo
            if (!interacted && !this.player.heldCable && this.player.model.hasWeapon && this.player.model.canShoot) {
               this.player.magnetGun?.fireBullet(this.magnetBullets);
               this.player.setModel({ canShoot: false });
            }
         }
      }

      this.cables.children.entries.forEach((c) => (c as any).update(time));
      this.machines.children.entries.forEach((m) => {
         const machine = m as MachineEntity;
         machine.update();
      });
      this.carLifts.children.entries.forEach((l) => {
         const lift = l as CarLift;
         lift.update(time, this.game.loop.delta);

         // --- PASSENGER LOGIC RESILIENTE ---
         const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
         const liftBody = lift.body as Phaser.Physics.Arcade.Body;

         // Check se Freddy è sopra la rampa con tolleranza ampia (necessaria per discese veloci)
         const isAbove = playerBody.bottom <= liftBody.top + 15 && playerBody.bottom >= liftBody.top - 15;
         const isWithinHorizontalBounds = playerBody.right > liftBody.left && playerBody.left < liftBody.right;

         if (isAbove && isWithinHorizontalBounds && lift.verticalDelta !== 0) {
            // Seguiamo il movimento della piattaforma
            this.player.y += lift.verticalDelta;

            // Se scendiamo, forziamo Freddy a "premere" sulla piattaforma per evitare jitter
            if (lift.verticalDelta > 0) {
               playerBody.setVelocityY(0);
            }
         }

         // --- CRUSH LOGIC (Schiacciamento) ---
         // Se Freddy è sotto la pedana (isBelow), la pedana scende (verticalDelta > 0) e Freddy ha il suolo sotto (blocked.down)
         const isBelow = playerBody.top <= liftBody.bottom + 10 && playerBody.top >= liftBody.bottom - 10;
         if (isBelow && isWithinHorizontalBounds && playerBody.blocked.down && lift.verticalDelta > 0) {
            if (this.player.model.status !== 'crushed' && this.player.model.status !== 'dead') {
               this.player.setModel({ status: 'crushed' });
            }
         }
      });

      // --- AGGIORNAMENTO PROIETTILI MAGNETICI (Automatico tramite runChildUpdate) ---
   }
}
