import { Scene, Tilemaps } from 'phaser';
import { BehaviorSubject } from 'rxjs';

export class DebugUtils {
   private static _instance: DebugUtils;
   gamePlayer$: BehaviorSubject<{ status: string; direction: string } | null> = new BehaviorSubject<{
      status: string;
      direction: string;
   } | null>(null);
   weapon$: BehaviorSubject<{ status: string; otherStatus: string } | null> = new BehaviorSubject<{
      status: string;
      otherStatus: string;
   } | null>(null);
   dataLevel$: BehaviorSubject<any> = new BehaviorSubject<any>(null);
   //ADD, remove it for other games

   constructor() {}

   static getInstance(): DebugUtils {
      if (this._instance) {
         return this._instance;
      }

      this._instance = new DebugUtils();
      return this._instance;
   }

   showDebugWalls(scene: Scene, tileLayer: Tilemaps.TilemapLayer): void {
      const debugGraphics = scene.add.graphics().setAlpha(0.7);
      tileLayer.renderDebug(debugGraphics, {
         tileColor: null,
         collidingTileColor: new Phaser.Display.Color(243, 234, 48, 255),
      });
   }
}
