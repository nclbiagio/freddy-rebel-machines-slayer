import { GameSceneTypes } from '../../../GameService';
import { BaseScene } from '../../../scenes/_template/BaseScene';
import { EventBus } from '../../../EventBus';
import { ProgressManager } from '../../../core/systems/ProgressManager';

export class LevelCompleteScene extends BaseScene<any, any> {
   static sceneKey: GameSceneTypes = 'LevelComplete';

   constructor() {
      super(LevelCompleteScene.sceneKey);
   }

   protected onInit(): void {
      console.log('LevelCompleteScene init');
      this.gameService.scene$.next(LevelCompleteScene.sceneKey);
   }

   protected onResumeHook(scene: GameSceneTypes, data?: { resumeFrom: GameSceneTypes; action?: string }): void {
      // Not used
   }

   create() {
      // Add listeners
      EventBus.on('level-complete:mounted', this.handleMounted);
      EventBus.on('level-complete:continue', this.handleContinue);

      this.events.on('shutdown', () => {
         EventBus.off('level-complete:mounted', this.handleMounted);
         EventBus.off('level-complete:continue', this.handleContinue);
      });
   }

   private handleMounted = () => {
      const prevScene = this.gameService.prevScene$.getValue();
      let stats = { timeBest: 0, timeLastRun: 0 };

      if (prevScene) {
         // Mark the previous level as completed in story progress
         ProgressManager.getInstance().markSceneAsCompleted(prevScene);

         const data = this.levelStore.dataLevel[prevScene];
         if (data) {
            stats = {
               timeBest: data.timeBest || 0,
               timeLastRun: data.timeLastRun || 0,
            };
         }
      }

      EventBus.emit('level-complete:data-loaded', stats);
   };

   private handleContinue = () => {
      const prevSceneKey = this.gameService.prevScene$.getValue();
      if (prevSceneKey) {
         this.scene.stop();
         this.scene.resume(prevSceneKey, { resumeFrom: 'LevelComplete' });
      }
   };
}
