import { GameSceneTypes } from '../../../GameService';
import { BaseScene } from '../../../scenes/_template/BaseScene';
import { endingSceneDialogues } from './EndingSceneDialogues';

/**
 * @description Ending cinematic scene showing only the animated sunny background and the final dialogue.
 */

export type TileLayersTypes = 'Ground';

export class EndingScene extends BaseScene<TileLayersTypes, ''> {
   static sceneKey: GameSceneTypes = 'EndingScene';

   private background!: Phaser.GameObjects.Sprite;

   constructor() {
      super(EndingScene.sceneKey);
   }

   protected onInit(): void {
      console.log('[EndingScene] init');
      this.gameService.scene$.next('EndingScene');
   }

   preload() {
      this.load.setPath(this.gameService.assetsPath);
      this.load.image('red_hair_man_talking', 'spritesheet/red_hair_man_talking.png');
      this.load.image('hooded_man_talking', 'spritesheet/hooded_man_talking.png');
      this.load.spritesheet('bg_sunny_day_animated', 'spritesheet/bg_sunny_day_animated.png', { frameWidth: 640, frameHeight: 640 });
   }

   protected onResumeHook(scene: GameSceneTypes, data?: { resumeFrom: GameSceneTypes; action?: string }): void {
      if (scene === 'Dialogue') {
         // Fine della scena, torniamo al menu
         this.changeScene(EndingScene.sceneKey, 'MenuStart', 'stop&start');
      }
   }

   create() {
      const { width, height } = this.scale;

      // Sfondo Solare Animato
      if (!this.anims.exists('sunny_day_loop')) {
         this.anims.create({
            key: 'sunny_day_loop',
            frames: this.anims.generateFrameNumbers('bg_sunny_day_animated', { start: 0, end: 7 }),
            frameRate: 6,
            repeat: -1,
         });
      }

      this.background = this.add.sprite(width / 2, height / 2, 'bg_sunny_day_animated');
      this.background.play('sunny_day_loop');
      this.background.setDisplaySize(width, height);
      this.background.setDepth(0);

      this.createCamera({ disableFadeOutFadeIn: false, fadeInFadeOutDuration: 1000 });

      // Avvio immediato del messaggio finale
      this.time.delayedCall(500, () => {
         this.openMessage('ending_outro');
      });
   }

   openMessage(msgId: string) {
      if (msgId) {
         const messages = endingSceneDialogues(this.gameService.assetsPath, {
            onNextCallback: this.onNextSceneCallback.bind(this),
         });
         this.changeScene(EndingScene.sceneKey, 'Dialogue', 'pause&resume', {
            msgId,
            messages,
            showCloseIcon: false,
         });
      }
   }

   onNextSceneCallback() {
      this.levelStore.setLevelStore(EndingScene.sceneKey, { completed: true });
   }

   override update(time: number): void {
      const loop = this.sys.game.loop;
      if (this.gameService.debug) {
         this.gameService.fps$.next(loop.actualFps);
         this.gameService.delta$.next(loop.delta);
      }
   }
}
