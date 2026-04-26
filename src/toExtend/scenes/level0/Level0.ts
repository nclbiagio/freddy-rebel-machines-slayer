import { BaseScene } from '../../../scenes/_template/BaseScene';
import { GameSceneTypes } from '../../../GameService';
import { FreddyEntity } from '../../../entities/FreddyEntity';
import { MagnetGunEntity } from '../../../entities/MagnetGunEntity';
import { MachineEntity } from '../../../entities/MachineEntity';
import { handleMachineInteractions } from '../../SceneUtils';
import { Level0CollisionService } from './Level0Collision';
import { createPlayer } from '../../../game/factories/PlayerFactory';
import { EventBus } from '../../../EventBus';
import { Level0Messages, getLevel0DialogueMessages } from './Level0Messages';
import { MusicTracker } from '../../../core/audio/MusicTracker';
import { createCablesGroup } from '../../games/freddyRebelMachinesSlayer/CableFactory';
import { createMachinesGroup } from '../../games/freddyRebelMachinesSlayer/MachineFactory';

export type ObjectLayersTypes = 'Player' | 'Cables' | 'Machines';
export type TileLayersTypes = 'Ground';

export const TILED_WIDTH = 640;
export const TILED_HEIGHT = 640;

export class Level0Scene extends BaseScene<TileLayersTypes, ObjectLayersTypes> {
   static sceneKey: GameSceneTypes = 'Level0';

   #collisionService!: Level0CollisionService;
   private magnetBullets!: Phaser.GameObjects.Group;
   private cables!: Phaser.GameObjects.Group;
   private machines!: Phaser.GameObjects.Group;
   #musicTracker = new MusicTracker(this, Level0Scene.sceneKey, 'level0');
   #musicCleanup: (() => void) | null = null;

   declare player: FreddyEntity;

   constructor() {
      super(Level0Scene.sceneKey);
   }

   protected onInit(): void {
      console.log(`Init ${Level0Scene.sceneKey}`);
      this.gameService.scene$.next(Level0Scene.sceneKey);
   }

   protected onResumeHook(scene: GameSceneTypes, data?: { resumeFrom: GameSceneTypes; action?: string }): void {
      if (scene === 'Dialogue') {
         console.log('[Level0] Ripresa da Dialogue');

         // Se avevamo appena finito il tutorial, passiamo al livello successivo
         if (this.#tutorialCompleted) {
            if (this.#musicCleanup) {
               this.#musicCleanup();
               this.#musicCleanup = null;
            }
            this.gameService.nextSceneFromTimeline(Level0Scene.sceneKey, this);
         }
      }
   }

   #tutorialCompleted: boolean = false;
   #flags = {
      welcome: false,
      shoot: false,
      drag: false,
      connect: false,
      sequence: false,
   };
   #hasMoved: boolean = false;
   #sequenceRevealed: boolean = false;

   create() {
      // 1. Skip Logic (Solo se già completato)
      const dataLevelFromSession = this.levelStore.dataLevelFromSession;
      if (dataLevelFromSession && dataLevelFromSession[Level0Scene.sceneKey]?.completed) {
         console.log('[Level0] Tutorial già completato, salto al livello successivo.');
         this.gameService.nextSceneFromTimeline(Level0Scene.sceneKey, this);
         return;
      }

      this.createTileLayers(
         Level0Scene.sceneKey,
         {
            Ground: { tilesetName: 'ground', imageKey: 'ground_laundry', collisions: true },
         },
         ['Ground']
      );
      this.createParallaxBackgrounds([
         { key: 'bg_laundry_far', scrollFactor: 0.2, depth: -100 },
         { key: 'bg_laundry_mid', scrollFactor: 0.5, depth: -50 },
         { key: 'bg_laundry_near', scrollFactor: 0.8, depth: -10 },
      ]);
      this.createObjectsLayers(['Player', 'Cables', 'Machines']);

      // Instanziamo il nuovo Player usando la Factory generica
      this.player = createPlayer(
         this,
         FreddyEntity.create,
         this.objectLayers?.Player?.objects[0],
         undefined, // exitRoomObjectLayer non usato qui
         TILED_WIDTH,
         TILED_HEIGHT,
         {
            enableShadow: false,
            enableExperienceEncrease: false,
         }
      );

      // Istanziamo la nuova arma calamita
      const magnetGun = MagnetGunEntity.create(this, { x: this.player.x, y: this.player.y });
      this.player.equipWeapon(magnetGun);

      // Gruppi per proiettili, cavi e macchine
      this.magnetBullets = this.createBullets(5, 'magnet');
      this.magnetBullets.runChildUpdate = true;
      this.cables = createCablesGroup(this, this.objectLayers?.Cables);
      this.machines = createMachinesGroup(this, this.objectLayers?.Machines);

      // Listener per il completamento del tutorial sul bus globale
      const onMachineSolved = () => {
         this.#tutorialCompleted = true;
         this.levelStore.setLevelStore(Level0Scene.sceneKey, { completed: true });

         // Trigger Victory Dialogue
         this.#launchDialogue('level0_victory');
      };

      EventBus.on('machine-solved', onMachineSolved);
      this.#musicCleanup = this.#musicTracker.initSceneSoundTrackEvents();

      // Fondamentale: puliamo il listener quando la scena viene chiusa o cambiata
      this.events.once('shutdown', () => {
         EventBus.off('machine-solved', onMachineSolved);
         if (this.#musicCleanup) {
            this.#musicCleanup();
         }
      });

      this.createPhysicsColliders();
      this.createCamera();
   }

   #launchDialogue(msgId: string) {
      this.changeScene(Level0Scene.sceneKey, 'Dialogue', 'pause&resume', {
         msgId,
         messages: getLevel0DialogueMessages(this.gameService.assetsPath),
         showCloseIcon: true,
      });
   }

   createPhysicsColliders(): void {
      if (this.tileLayers?.Ground) {
         this.#collisionService = new Level0CollisionService(this, {
            player: this.player,
            groundLayer: this.tileLayers.Ground,
            cables: this.cables,
            playerBullets: this.magnetBullets,
            machines: this.machines,
         });

         this.#collisionService.init();
      }
   }

   override update(time: number): void {
      if (this.player) {
         this.player.update(time);

         this.machines.children.entries.forEach((m) => {
            (m as MachineEntity).checkPlayerProximity(this.player);
         });

         this.#updateTutorial(time);

         const interacted = handleMachineInteractions(this, this.player as FreddyEntity, this.machines);

         if (!interacted && !this.player.heldCable && this.player.model.hasWeapon && this.player.model.canShoot) {
            this.player.magnetGun?.fireBullet(this.magnetBullets);
            this.player.setModel({ canShoot: false });
         }
      }

      this.cables.children.entries.forEach((c) => (c as any).update(time));
      this.machines.children.entries.forEach((m) => {
         const machine = m as MachineEntity;
         if (this.player) {
            if (machine.model.isPlayerNear && !this.#sequenceRevealed) {
               this.#sequenceRevealed = true;

               // Overlay Dialogue per la regola della sequenza
               this.#launchDialogue('level0_sequence');

               this.time.delayedCall(1500, () => {
                  machine.revealSequence();
               });
            }
         }
         machine.update();
      });
   }

   #updateTutorial(time: number) {
      if (this.#tutorialCompleted) return;

      // 1. WELCOME (Fly Message)
      if (!this.#flags.welcome) {
         this.messageUtils.addFlyMessage({ key: 'scene_tut_welcome', text: Level0Messages.welcome });
         this.#flags.welcome = true;
      }

      const hasMoved = Math.abs(this.player.body.velocity.x) > 10 || Math.abs(this.player.body.velocity.y) > 10;
      if (hasMoved) this.#hasMoved = true;

      // 2. SHOOT (Fly Message)
      if (this.#hasMoved && !this.player.heldCable && !this.#flags.shoot) {
         this.messageUtils.addFlyMessage({
            key: 'scene_tut_shoot',
            text: Level0Messages.shoot,
         });
         this.#flags.shoot = true;
      }

      // 3. DRAG & DROP (Fly Message)
      if (this.player.heldCable && !this.#flags.drag) {
         this.messageUtils.removeFlyMessage('scene_tut_shoot');
         this.messageUtils.addFlyMessage({
            key: 'scene_tut_drag',
            text: Level0Messages.drag,
         });
         this.#flags.drag = true;
         this.#flags.shoot = true;
      }
   }
}
