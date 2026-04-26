import { Scene } from 'phaser';
import { GameSceneTypes, GameService } from '../../../GameService';
import { MessageUtils } from '../../../message/Message';
import { Message } from '../../../message/model';
import { EventBus } from '../../../EventBus';
import { SceneData } from '../../../models/Game';
import { getExampleVn } from '../../../message/example';
import { ProgressManager } from '../../../core/systems/ProgressManager';

type ExtendedSceneData = SceneData | undefined; //You can extend here SceneData like (SceneData & { enemyId: string }) | undefined;

export class ChapterTemplateScene extends Scene {
   static sceneKey: GameSceneTypes = 'ChapterTemplate';
   #gameService = GameService.getInstance();
   #messageUtils = MessageUtils.getInstance();
   #storyProgress = ProgressManager.getInstance();
   #data: ExtendedSceneData;
   constructor() {
      super({
         key: ChapterTemplateScene.sceneKey,
      });
   }

   init(data: ExtendedSceneData) {
      this.#data = data;
      this.#gameService.scene$.next(ChapterTemplateScene.sceneKey);
      this.addMessageToNovel();
   }

   addMessageToNovel() {
      const messages: Message[] = [...getExampleVn(this.#gameService.assetsPath)];
      messages.forEach((msg) => {
         this.#messageUtils.addMessage(msg);
      });
   }

   create() {
      this.createSceneEvents();
      const msgToOpen = this.#data && this.#data.msgId ? this.#data.msgId : null;
      if (msgToOpen) {
         this.#messageUtils.openMessage(msgToOpen);
      } else {
         //If msgId not provided then get the first msg of the scene
         const firstMsgOfScene = this.#messageUtils.messages.filter((msg) => msg.sceneId === ChapterTemplateScene.sceneKey)[0].id;
         if (firstMsgOfScene) {
            this.#messageUtils.openMessage(firstMsgOfScene);
         } else {
            //TODO send to fallback scene
         }
      }
   }

   createSceneEvents() {
      EventBus.on('trigger-scene', (sceneId: GameSceneTypes, msgId?: string) => {
         if (msgId) {
            this.#data = {
               ...this.#data,
               msgId,
            };
         }
         this.#gameService.nextSceneFromTimeline(ChapterTemplateScene.sceneKey, this, sceneId, this.#data);
      });
   }
}
