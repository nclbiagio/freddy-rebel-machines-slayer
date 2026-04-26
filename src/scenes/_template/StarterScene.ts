//REPLACE Example WITH THE NAME OF YOUR SCENE
import { Scene } from 'phaser';
import { GameSceneTypes, GameService } from '../../GameService';
import { MusicTracker } from '../../core/audio/MusicTracker';
import { EventBus } from '../../EventBus';
import { SceneData } from '../../models/Game';

type ExtendedSceneData = SceneData | undefined; //You can extend here SceneData like (SceneData & { enemyId: string }) | undefined;

export class ExampleScene extends Scene {
   static sceneKey: GameSceneTypes = 'Example';
   #data: ExtendedSceneData;
   #gameService = GameService.getInstance();

   #musicTracker = new MusicTracker(this, ExampleScene.sceneKey);

   constructor() {
      super({
         key: ExampleScene.sceneKey,
      });
   }

   init(data: ExtendedSceneData) {
      this.#data = data;
      this.#gameService.scene$.next(ExampleScene.sceneKey);
      if (!this.#gameService.debug) {
         this.#musicTracker.initSceneSoundTrackEvents(false);
      }
   }

   create() {
      this.createSceneInputEvents();
      this.createSceneEvents();
   }

   createSceneInputEvents() {
      //remove audio
      this.input.keyboard?.on('keydown-Q', () => {
         this.#musicTracker.toggleSoundtrack();
      });
   }

   createSceneEvents() {
      EventBus.on('trigger-scene', (sceneId: GameSceneTypes) => {
         this.#gameService.nextSceneFromTimeline(ExampleScene.sceneKey, this, sceneId, this.#data);
      });
   }
}
