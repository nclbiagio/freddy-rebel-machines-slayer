import { BehaviorSubject } from 'rxjs';
import { FlyMessageModel, FlyMessagesType, InteractMessageModel, Message, OpenMessageOptions } from './model';

//README -> when open message there's no check on scene, if there's duplicated could be a problem,
// so to avoid any problems please try to make the ids unique perhaps by prefixing the scene to the message id, for example level1_1

export class MessageUtils {
   private static _instance: MessageUtils;
   #messages: Message[] = [];
   #selectedMessageId$: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
   //FOR FLY MESSAGES key message naming convention, Because so you can reuse flyMessages everywhere
   //prefix game scene messages with -> scene_
   //prefix utils debugger messages with -> utils_
   //prefix error messages with -> error_
   #flyMessages$: BehaviorSubject<FlyMessageModel[]> = new BehaviorSubject<FlyMessageModel[]>([]);
   showCloseIcon = true;
   flyMessagesValidPrefix: FlyMessagesType[] = ['scene_', 'utils_', 'error_'];
   // INTERACT MESSAGES
   #interactMessages$: BehaviorSubject<InteractMessageModel[]> = new BehaviorSubject<InteractMessageModel[]>([]);

   constructor() {}

   static getInstance(): MessageUtils {
      if (this._instance) {
         return this._instance;
      }

      this._instance = new MessageUtils();
      return this._instance;
   }

   get messages() {
      return this.#messages;
   }

   get selectedMessageId$() {
      return this.#selectedMessageId$;
   }

   getMessagesByScene(currentScene: string) {
      return this.messages.filter((message) => message.sceneId === currentScene);
   }

   addMessage(message: Message) {
      const msgAlreadyRegistered = this.#messages.find((msg) => msg.id === message.id && msg.sceneId === message.sceneId);
      if (!msgAlreadyRegistered) {
         this.#messages.push(message);
      } else {
         console.info(`Message with id ${message.id} already registered for scene ${message.sceneId}`);
      }
   }

   #selectMessageById(id: string) {
      const msg = this.messages.find((msg) => msg.id === id);
      if (msg) {
         this.#selectedMessageId$.next(msg.id);
         //console.info(`Message open: ${msg.id}`);
      } else {
         console.info(`Message with id ${id} not available`);
      }
   }

   openMessage(id: string, options?: OpenMessageOptions) {
      this.closeMessage();
      if (options) {
         this.showCloseIcon = options.showCloseIcon !== undefined ? options.showCloseIcon : true;
      }
      this.#selectMessageById(id);
   }

   closeMessage() {
      if (!this.#selectedMessageId$.getValue()) {
         this.#selectedMessageId$.next(null);
      }
   }

   get flyMessages$() {
      return this.#flyMessages$.asObservable();
   }

   get flyMessages() {
      return this.#flyMessages$.getValue();
   }

   get interactMessages$() {
      return this.#interactMessages$.asObservable();
   }

   showInteractMessage(msg: InteractMessageModel) {
      const current = this.#interactMessages$.getValue();
      // Avoid duplicates
      if (!current.find((m) => m.id === msg.id)) {
         this.#interactMessages$.next([...current, msg]);
      }
   }

   hideInteractMessage(id: string) {
      const current = this.#interactMessages$.getValue();
      const updated = current.filter((m) => m.id !== id);
      if (current.length !== updated.length) {
         this.#interactMessages$.next(updated);
      }
   }

   addFlyMessage(msg: FlyMessageModel) {
      const containsPrefix = this.flyMessagesValidPrefix.some((prefix) => msg.key.includes(prefix));
      
      if (msg.key.startsWith('error_')) {
         console.error(`[FlyMessage Error] ${msg.key}: ${msg.text}`);
      }

      if (msg && containsPrefix) {
         const currentAvailableKeys = this.flyMessages.map((msgs) => msgs.key);
         if (!currentAvailableKeys.includes(msg.key)) {
            const updated = [...this.#flyMessages$.getValue(), msg];
            this.#flyMessages$.next(updated);
         } else {
            const errorMsg = { key: 'error_flyMessage', text: `Msg key ${msg.key} duplicated` };
            console.error(`[FlyMessage Error] ${errorMsg.key}: ${errorMsg.text}`);
            const updated = [...this.#flyMessages$.getValue(), errorMsg];
            this.#flyMessages$.next(updated);
         }
      } else {
         /* const updated = [...this.#flyMessages$.getValue(), { key: 'error_flyMessage', text: ''}];
         this.#flyMessages$.next(updated); */
      }
   }

   removeFlyMessage(key: string) {
      if (key) {
         const updated = this.#flyMessages$.getValue().filter((m) => m.key !== key);
         this.#flyMessages$.next(updated);
      }
   }
}
