import { Scene } from 'phaser';
import { GameService } from '../../GameService';
import { EventBus } from '../../EventBus';
import { MusicTracker } from '../../core/audio/MusicTracker';

export class MenuStartScene extends Scene {
   #gameService = GameService.getInstance();
   #musicTracker = new MusicTracker(this, 'MenuStart', 'menu-theme');
   #musicCleanup: (() => void) | null = null;

   constructor() {
      super({
         key: 'MenuStart',
      });
   }

   init() {
      this.#gameService.scene$.next('MenuStart');

      const playHandler = () => {
         this.#musicTracker.stopTrackOnly();
         this.#gameService.nextSceneFromTimeline('MenuStart', this);
      };

      EventBus.on('play-game', playHandler);

      if (!this.#gameService.debug) {
         this.#musicCleanup = this.#musicTracker.initSceneSoundTrackEvents(false);
      }

      this.events.once('shutdown', () => {
         EventBus.off('play-game', playHandler);
         if (this.#musicCleanup) {
            this.#musicCleanup();
         }
      });
   }

   create() {
      this.createSceneInputEvents();
   }

   createSceneInputEvents() {
      //remove audio
      this.input.keyboard?.on('keydown-Q', () => {
         this.#musicTracker.toggleSoundtrack();
      });
   }
}
