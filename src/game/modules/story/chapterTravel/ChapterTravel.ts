import { Scene } from 'phaser';
import { GameSceneTypes, GameService } from '../../../../GameService';
import { MessageUtils } from '../../../../message/Message';
import { ProgressManager } from '../../../../core/systems/ProgressManager';
import { SceneData } from '../../../../models/Game';
import { Message } from '../../../../message/model';
import { EventBus } from '../../../../EventBus';
import { getTravelMessages } from './getTravelMessages';

interface BiomeData {
   name: string; // es: "Foresta", "Deserto", "Montagna"
   encounterRate: number; // es: 0.3 => 30% di incontrare mostro
   enemyPool: string[]; // ID dei nemici che possono apparire
   travelMessages: string[]; // Descrizioni del viaggio es: ["Il vento sferza tra gli alberi...", "Uccelli in lontananza si alzano in volo"]
   safeTravelRate: number; // possibilità che non accada nulla (complementare all’encounter + event rate)
}

type ExtendedSceneData = (SceneData & BiomeData) | undefined;

export class ChapterTravelScene extends Scene {
   static sceneKey: GameSceneTypes = 'ChapterTravel';
   #gameService = GameService.getInstance();
   #messageUtils = MessageUtils.getInstance();
   #storyProgress = ProgressManager.getInstance();
   #data: ExtendedSceneData;
   constructor() {
      super({
         key: ChapterTravelScene.sceneKey,
      });
   }

   init(data: ExtendedSceneData) {
      this.#data = data;
      this.#gameService.scene$.next(ChapterTravelScene.sceneKey);
      this.addMessageToNovel();
   }

   addMessageToNovel() {
      if (!this.#data?.nextScene) {
         console.error('Next scene not defined');
      }
      const messages: Message[] = [...getTravelMessages(this.#gameService.assetsPath, this.#data?.nextScene || 'Error')];
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
         const firstMsgOfScene = this.#messageUtils.messages.filter((msg) => msg.sceneId === ChapterTravelScene.sceneKey)[0].id;
         if (firstMsgOfScene) {
            this.#messageUtils.openMessage(firstMsgOfScene);
         } else {
            //TODO send to fallback scene
         }
      }
   }

   createSceneEvents() {
      EventBus.on('trigger-scene', (sceneId: GameSceneTypes) => {
         if (sceneId) {
            this.#gameService.nextSceneFromTimeline(ChapterTravelScene.sceneKey, this, sceneId, this.#data);
         }
      });
   }
}
