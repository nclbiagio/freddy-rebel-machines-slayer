import { Tilemaps } from 'phaser';
import { GameSceneTypes } from '../GameService';

export type Cursors = Record<'w' | 'a' | 's' | 'd' | 'up' | 'x' | 'left' | 'down' | 'right' | 'space', Phaser.Input.Keyboard.Key>;

export type TileLayers<T extends string> = Record<T, Tilemaps.TilemapLayer>;

export type ObjectLayers<T extends string> = Record<T, Tilemaps.ObjectLayer>;

export interface SceneData {
   msgId?: string;
   //THIS nextScene IS MAINLY USED IN VISUAL NOVELS for that scenes
   //that fall out of the message flow and need to know where to return to
   nextScene?: GameSceneTypes;
   toDebug?: boolean;
   error?: string; //This is for error scene
}

export type PosGetter = () => { x: number; y: number };

export interface SharedEnemyData {
   id: string;
   marks: string[];
   being: string; //es: plague
   type: string; //es: dumb or firing
   experience: number;
   x: number;
   y: number;
}
