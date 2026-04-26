import { MusicTracker } from '../../../core/audio/MusicTracker';
import { GameSceneTypes } from '../../../GameService';
import { BaseScene } from '../../../scenes/_template/BaseScene';
import { introPrologueDialogues } from './IntroPrologueDialogues';
import { StormSound } from '../../../core/audio/StormSound';

/**
 * @description Intro cinematic scene staged as a dialogue between two characters.
 */

export type TileLayersTypes = 'Ground';

export class IntroPrologueScene extends BaseScene<TileLayersTypes, ''> {
   static sceneKey: GameSceneTypes = 'IntroPrologue';

   private freddy!: Phaser.GameObjects.Sprite;
   private freddyShadow!: Phaser.GameObjects.Sprite;
   private floorBg!: Phaser.GameObjects.Rectangle;
   private floorLines!: Phaser.GameObjects.Graphics;
   private gun!: Phaser.GameObjects.Sprite;
   private background!: Phaser.GameObjects.Sprite;
   private isCutsceneRunning = false;
   #musicTracker = new MusicTracker(this, IntroPrologueScene.sceneKey, 'cinematic');
   #musicCleanup: (() => void) | null = null;
   private stormSound = new StormSound();

   constructor() {
      super(IntroPrologueScene.sceneKey);
   }

   protected onInit(): void {
      console.log('[IntroPrologueScene] init');
      this.gameService.scene$.next('IntroPrologue');

      if (!this.gameService.debug) {
         this.#musicCleanup = this.#musicTracker.initSceneSoundTrackEvents(true);
      }

      const cleanup = () => {
         if (this.#musicCleanup) {
            this.#musicCleanup();
            this.#musicCleanup = null;
         }
         this.stormSound.stop(true); // Stop immediato per evitare leak nel menu
      };

      this.events.once('shutdown', cleanup);
      this.events.once('destroy', cleanup);
   }

   preload() {
      this.load.setPath(this.gameService.assetsPath);
      this.load.image('red_hair_man_talking', 'spritesheet/red_hair_man_talking.png');
      this.load.image('hooded_man_talking', 'spritesheet/hooded_man_talking.png');
      this.load.spritesheet('bg_thunderstorm_animated', 'spritesheet/bg_thunderstorm_animated.png', { frameWidth: 640, frameHeight: 640 });
      this.load.spritesheet('freddy_cutscene', 'spritesheet/freddy.png', { frameWidth: 32, frameHeight: 32 });
      this.load.image('magnetGun_prologue', 'spritesheet/magnetGun.png');
      this.load.image('magnetProjectile_prologue', 'spritesheet/magnetProjectile.png');
      this.load.image('ground_laundry', 'tilemaps/lv0/ground.png');
   }

   protected onResumeHook(scene: GameSceneTypes, data?: { resumeFrom: GameSceneTypes; action?: string }): void {
      if (scene === 'Dialogue') {
         this.#musicTracker.stopTrackOnly();
         this.startCutscene();
      }
   }

   create() {
      const { width, height } = this.scale;

      // Avvio tempesta procedurale (Pioggia e Vento)
      this.stormSound.play();

      this.anims.create({
         key: 'thunderstorm_loop',
         frames: this.anims.generateFrameNumbers('bg_thunderstorm_animated', { start: 0, end: 7 }),
         frameRate: 4,
         repeat: -1,
      });

      this.background = this.add.sprite(width / 2, height / 2, 'bg_thunderstorm_animated');
      this.background.play('thunderstorm_loop');
      this.background.setDisplaySize(width, height);
      this.background.setDepth(0);
      this.background.setTint(0x333333); // Più visibile nel buio

      // Pavimento Scurissimo
      this.floorBg = this.add.rectangle(0, height / 2, width, height / 2, 0x0a0a0a);
      this.floorBg.setOrigin(0, 0);
      this.floorBg.setDepth(1);

      // Grafica per le linee della griglia (solo orizzontali)
      this.floorLines = this.add.graphics();
      this.floorLines.setDepth(2);

      // Freddy
      if (!this.anims.exists('freddy_run')) {
         this.anims.create({
            key: 'freddy_run',
            frames: this.anims.generateFrameNumbers('freddy_cutscene', { start: 4, end: 9 }),
            frameRate: 12,
            repeat: -1,
         });
      }

      // Freddy parte da sinistra fuori campo, centrato verticalmente
      this.freddy = this.add.sprite(-50, height / 2, 'freddy_cutscene', 0);
      this.freddy.setScale(2);
      this.freddy.setAlpha(0);
      this.freddy.setTint(0x333333); // Freddy più visibile nell'ombra

      // Shadow (Ombra scurissima)
      this.freddyShadow = this.add.sprite(this.freddy.x, this.freddy.y + 30, 'freddy_cutscene', 0);
      this.freddyShadow.setTint(0x000000);
      this.freddyShadow.setAlpha(0);
      this.freddyShadow.setScale(2, 5);
      this.freddyShadow.setAngle(180);
      this.freddyShadow.setFlipX(true);
      this.freddyShadow.setOrigin(0.5, 1);
      this.freddyShadow.setDepth(5);

      // Freddy
      this.freddy.setDepth(10);

      // Gun
      this.gun = this.add.sprite(this.freddy.x + 10, this.freddy.y, 'magnetGun_prologue');
      this.gun.setScale(1.5);
      this.gun.setOrigin(0, 0.5);
      this.gun.setAlpha(0);
      this.gun.setDepth(15);
      this.gun.setTint(0x333333); // Arma più visibile nell'ombra

      this.createCamera({ disableFadeOutFadeIn: false, fadeInFadeOutDuration: 1000 });

      // Avvio Dialogo se non completato
      const dataLevelFromSession = this.levelStore.dataLevelFromSession;
      if (dataLevelFromSession && dataLevelFromSession[IntroPrologueScene.sceneKey]?.completed) {
         console.log('[IntroPrologueScene] Already completed, skipping...');
         this.gameService.nextSceneFromTimeline(IntroPrologueScene.sceneKey, this);
         return;
      }

      this.time.delayedCall(500, () => {
         this.openMessage('prologue_intro');
      });
   }

   startCutscene() {
      if (this.isCutsceneRunning) return;
      this.isCutsceneRunning = true;
      const { width, height } = this.scale;

      // Apparizione e Corsa verso il centro
      this.freddy.setAlpha(1);
      this.freddyShadow.setAlpha(0.7); // Ombra molto scura
      this.gun.setAlpha(1);
      this.freddy.play('freddy_run');
      this.freddyShadow.play('freddy_run');

      this.tweens.add({
         targets: this.freddy,
         x: width / 2,
         y: height / 2,
         duration: 2000,
         ease: 'Power1',
         onComplete: () => {
            this.freddy.stop();
            this.freddy.setFrame(0);
            this.triggerLightning();
         },
      });
   }

   private triggerLightning() {
      // Effetto lampo
      this.cameras.main.flash(300, 255, 255, 255);

      // Illuminazione temporanea
      this.background.setTint(0xaaaaaa);
      this.floorBg.setFillStyle(0x666666);
      this.freddy.setTint(0xffffff);
      this.gun.setTint(0xffffff);
      this.freddyShadow.setAlpha(0.6);

      // Avvio sequenza ispezione
      this.aimSequence();
   }

   private aimSequence() {
      const angles = [-90, 45, 0]; // Su, Giù diagonale, Dritto
      let index = 0;

      const aimNext = () => {
         if (index >= angles.length) {
            this.time.delayedCall(500, () => {
               // Ritorno all'oscurità
               this.tweens.add({
                  targets: [this.background, this.freddy, this.gun],
                  duration: 800,
                  onStart: () => {
                     this.background.setTint(0x333333);
                     this.floorBg.setFillStyle(0x1a1a1a);
                     this.freddy.setTint(0x333333);
                     this.gun.setTint(0x333333);
                     this.freddyShadow.setAlpha(0);
                  },
                  onComplete: () => this.runAway(),
               });
            });
            return;
         }

         const angle = angles[index];
         this.gun.setAngle(angle);

         index++;
         this.time.delayedCall(600, aimNext);
      };

      aimNext();
   }

   private runAway() {
      const { width } = this.scale;
      this.gun.setAngle(0);
      this.freddy.play('freddy_run');
      this.freddyShadow.play('freddy_run');

      this.tweens.add({
         targets: this.freddy,
         x: width + 100,
         duration: 1500,
         ease: 'Power2',
         onComplete: () => {
            this.stormSound.stop();
            this.gameService.nextSceneFromTimeline(IntroPrologueScene.sceneKey, this);
         },
      });
   }

   private drawPerspectiveFloor(time: number) {
      const { width, height } = this.scale;
      const horizonY = height / 2;

      this.floorLines.clear();
      this.floorLines.lineStyle(1, 0x444444, 0.4);

      // Linee trasversali (orizzontali prospettiche fisse)
      for (let j = 0; j < 15; j++) {
         const progress = j / 15;
         const y = horizonY + progress * progress * (height - horizonY);

         if (y > horizonY && y < height) {
            this.floorLines.lineBetween(0, y, width, y);
         }
      }
   }

   openMessage(msgId: string) {
      if (msgId) {
         const messages = introPrologueDialogues(this.gameService.assetsPath, {
            onNextCallback: this.onNextSceneCallback.bind(this),
         });
         this.changeScene(IntroPrologueScene.sceneKey, 'Dialogue', 'pause&resume', {
            msgId,
            messages,
            showCloseIcon: false,
         });
      }
   }

   onNextSceneCallback() {
      this.levelStore.setLevelStore(IntroPrologueScene.sceneKey, { completed: true });
   }

   override update(time: number): void {
      if (this.isCutsceneRunning) {
         this.gun.x = this.freddy.x + 10;
         this.gun.y = this.freddy.y;

         // Sincronizzazione ombra fissa
         this.freddyShadow.x = this.freddy.x;
         this.freddyShadow.y = this.freddy.y + 32;
         this.freddyShadow.setScale(2, 5);
         this.freddyShadow.setFrame(this.freddy.frame.name);

         // Disegno Griglia Prospettica (fissa)
         this.drawPerspectiveFloor(time);
      }

      const loop = this.sys.game.loop;
      if (this.gameService.debug) {
         this.gameService.fps$.next(loop.actualFps);
         this.gameService.delta$.next(loop.delta);
      }
   }
}
