import { GameSceneTypes, GameType } from './GameService';
import { toExtendTimelime } from './toExtend/toExtendTimeLine';

export interface Timeline {
   id: GameSceneTypes;
   nextScene: GameSceneTypes | 'dynamicNextScene' | 'none';
   specificFor?: GameType[];
   backScene?: GameSceneTypes;
   zIndex?: string;
   hideInDebugger?: boolean;
}

/**
 * @description if the game is structured into multiple levelRooms like the Level1Room2
 * then the next scene is determined from tiled map with the name of the exit scene that must match one of the GameSceneTypes
 */
export const timelime: Timeline[] = [
   {
      id: 'LoadAssets',
      nextScene: (import.meta.env.VITE_GAME_AFTER_LOAD_SCENE as GameSceneTypes) || 'MenuStart', //CHANGE this to proper game scene or Extend from toExtend folder
   },
   {
      id: 'MenuStart',
      nextScene: (import.meta.env.VITE_GAME_STARTER_SCENE as GameSceneTypes) || 'none', //CHANGE this to proper game scene or Extend from toExtend folder
   },
   {
      id: 'ChapterTemplate',
      nextScene: 'none',
      specificFor: ['Novel'],
   },
   {
      id: 'Dialogue',
      nextScene: 'none',
      hideInDebugger: true, //Dialogue is testable
      specificFor: ['TopDown', '2D'],
   },
   {
      id: 'TurnCombat',
      nextScene: 'none',
      specificFor: ['Novel'],
   },
   {
      id: 'WorldMap',
      nextScene: 'dynamicNextScene',
   },
   {
      id: 'ChapterTravel',
      nextScene: 'none',
   },
   ...toExtendTimelime,
];
