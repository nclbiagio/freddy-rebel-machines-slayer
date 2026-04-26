import { Scene } from 'phaser';
import { GameSceneTypes, GameService } from '../../GameService';
import { MusicTracker } from '../../core/audio/MusicTracker';
import { SceneData } from '../../models/Game';
import { Message, OpenMessageOptions } from '../../message/model';
import { MessageUtils } from '../../message/Message';
import { EventBus } from '../../EventBus';

export class DialogueScene extends Scene {
   static sceneKey: GameSceneTypes = 'Dialogue';
   #gameService = GameService.getInstance();
   #messageUtils = MessageUtils.getInstance();
   #musicTracker = new MusicTracker(this, 'Dialogue');
   #musicCleanup: (() => void) | null = null;

   resources: (SceneData & { messages: Message[] } & OpenMessageOptions) | null = null;

   constructor() {
      super({
         key: 'Dialogue',
      });
   }

   init(data: SceneData & { messages: Message[] }) {
      this.#gameService.scene$.next('Dialogue');
      if (data && data.msgId && data.messages) {
         this.resources = data;
         this.registerMessagesToScene(data.messages);
      } else {
         //TODO go to another fallback scene
      }

      const firstMsg = data?.messages?.[0];
      if (!this.#gameService.debug && firstMsg?.bgm) {
         this.#musicTracker = new MusicTracker(this, 'Dialogue', firstMsg.bgm);
         this.#musicCleanup = this.#musicTracker.initSceneSoundTrackEvents(false);
      }

      this.events.once('shutdown', () => {
         if (this.#musicCleanup) {
            this.#musicCleanup();
            this.#musicCleanup = null;
         }
      });
   }

   registerMessagesToScene(messages: Message[]) {
      messages.forEach((msg) => {
         this.#messageUtils.addMessage(msg);
      });
   }

   create() {
      this.createSceneInputEvents();
      const msgToOpen = this.resources && this.resources.msgId ? this.resources.msgId : null;
      if (msgToOpen) {
         this.#messageUtils.openMessage(msgToOpen, { showCloseIcon: this.resources?.showCloseIcon });
      } else {
         //If msgId not provided then get the first msg of the scene
         const firstMsgOfScene = this.#messageUtils.messages.filter((msg) => msg.sceneId === DialogueScene.sceneKey)[0].id;
         if (firstMsgOfScene) {
            this.#messageUtils.openMessage(firstMsgOfScene);
         } else {
            //TODO send to fallback scene
         }
      }
   }

   createSceneInputEvents() {
      //remove audio
      this.input.keyboard?.on('keydown-Q', () => {
         this.#musicTracker.toggleSoundtrack();
      });
      EventBus.on('trigger-scene', (sceneId: GameSceneTypes, action: 'fromCloseX' | undefined) => {
         this.closeDialogue(sceneId, action);
      });
   }

   closeDialogue(sceneId: GameSceneTypes, action: 'fromCloseX' | undefined) {
      const prevScene = this.#gameService.prevScene$.value;
      if (prevScene && prevScene === sceneId) {
         this.scene.stop(); // Chiudi la scena
         const dataToSendBack = action ? { resumeFrom: 'Dialogue', action } : { resumeFrom: 'Dialogue' };
         this.scene.resume(prevScene, dataToSendBack); // Riprendi la scena precedente principale
         this.scene.bringToTop(prevScene);
         this.#gameService.scene$.next(prevScene);
      } else {
         console.log(`Land to ${sceneId}`);
         if (sceneId === 'SceneFallback') {
         }
         console.error(`Error: ${prevScene} not valid`);
      }
   }
}
