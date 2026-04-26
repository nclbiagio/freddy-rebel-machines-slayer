import { BehaviorSubject } from 'rxjs';
import { Game, Tilemaps } from 'phaser';
import { timelime } from './Timeline';
import { SceneData } from './models/Game';
import { ToExtendGameSceneChaptersTypes, ToExtendGameSceneLevelsTypes } from './toExtend/GameSceneTypes';

export const TILESIZE = 32;

export type BaseGameSceneTypes =
   | 'Example'
   | 'LoadAssets'
   | 'MenuStart'
   | 'SandBox'
   | 'Game' //TODO ? to be checked
   | 'TurnCombat' //Meant for Novels or Jrpg
   | 'WorldMap'
   | 'OptionMenu' //TODO to be developed
   | 'Inventory'
   | 'Chest'
   | 'Dialogue'
   | 'LevelManager' //TODO to be developed
   | 'GameOver'
   | 'GameWin' //TODO to be developed
   | 'Error' //TODO to be developed
   | 'SceneFallback'; //TODO to be developed

//IF LEVELS, SCENES, CHAPTERS OR DIALOGUES
export type GameSceneLevelsTypes = 'Level0' | ToExtendGameSceneLevelsTypes;
export type GameSceneChaptersTypes = 'ChapterTemplate' | 'ChapterTravel' | ToExtendGameSceneChaptersTypes; //ChapterTravel Meant for Novels but can be used for almost everything but to be tested;

//IF LEVELS
export type GameSceneTypes = BaseGameSceneTypes | GameSceneLevelsTypes | GameSceneChaptersTypes;

export type GameType = '2D' | 'TopDown' | 'Novel';

export class GameService {
   private static _instance: GameService;
   //---------- DEBUG
   debug = import.meta.env.VITE_GAME_DEBUG === 'true' ? true : false;
   fps$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
   delta$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
   //----------
   type: GameType = (import.meta.env.VITE_GAME_TYPE as GameType) || 'TopDown';
   showPlayerStats = import.meta.env.VITE_SHOW_PLAYER_STATS === 'true' ? true : false;
   #storageKey: string = (import.meta.env.VITE_STORAGE_KEY as GameType) || 'dataLevel';
   game: Game | null = null;
   tileMap: Tilemaps.Tilemap | null = null;
   scene$: BehaviorSubject<GameSceneTypes | null> = new BehaviorSubject<GameSceneTypes | null>(null);
   prevScene$: BehaviorSubject<GameSceneTypes | null> = new BehaviorSubject<GameSceneTypes | null>(null);
   historyScenes: GameSceneTypes[] = [];

   assetsPath = 'assets/';

   loadProgress$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
   musicIsPlaying$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);

   constructor() {
      if (this.debug) {
         console.log({
            debug: this.debug,
            gameType: this.type,
            assetsPath: this.assetsPath,
            timeLine: timelime,
         });
      }
   }

   getOriginAssets() {
      const origin = window.location.href.replace('/index.html', '');
      return `${origin}/assets/`;
   }

   get storageKey() {
      return this.#storageKey;
   }

   static getInstance(): GameService {
      if (this._instance) {
         return this._instance;
      }

      this._instance = new GameService();
      return this._instance;
   }

   /**
    *
    * @param currentSceneType
    * @param currentScene
    * @param forceNextSceneId
    * @param data
    * @description call this method on room change
    */
   nextSceneFromTimeline(currentSceneType: GameSceneTypes, currentScene: Phaser.Scene, forceNextSceneId?: GameSceneTypes, data?: SceneData) {
      const timelineScene = timelime.find((scene) => scene.id === currentSceneType);
      if (timelineScene && this.game) {
         const currentSceneId = timelineScene.id;
         let nextSceneId = timelineScene.nextScene;
         if (timelineScene.nextScene === 'dynamicNextScene' && forceNextSceneId) {
            nextSceneId = forceNextSceneId;
         }
         if (!nextSceneId || nextSceneId === 'dynamicNextScene') {
            console.error(`The scene ${nextSceneId} is not valid`);
            return;
         }
         if (nextSceneId === 'none') {
            console.info(`In Timeline next scene of ${currentSceneType} is set as none`);
            return;
         }
         this.prevScene$.next(currentSceneType);
         currentScene.scene.stop(currentSceneId);
         currentScene.scene.start(nextSceneId, data);
         this.historyScenes.push(nextSceneId);
      }
   }

   travelToScene(nextScene: GameSceneTypes, currentSceneKey: GameSceneTypes, currentScene: Phaser.Scene, sceneData?: SceneData & { [key: string]: any }) {
      if (this.game) {
         this.prevScene$.next(currentSceneKey);
         currentScene.scene.stop(currentSceneKey);
         currentScene.scene.start(nextScene, sceneData);
         this.historyScenes.push(nextScene);
      }
   }
}
