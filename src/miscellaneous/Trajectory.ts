import { GameObjects, Scene, Tilemaps } from 'phaser';
import { GameService, TILESIZE } from '../GameService';
export class Trajectory {
   scene: Scene;
   lineGraphics: GameObjects.Graphics;
   line: Phaser.Geom.Line;
   points: any;
   x: number;
   y: number;
   offsetX = 20;
   offsetY = 20;
   overlap = false;
   layer: Tilemaps.TilemapLayer;
   lineOpacity = GameService.getInstance().debug ? 1.0 : 0.1;

   constructor(scene: Scene, layer: Tilemaps.TilemapLayer, x: number, y: number) {
      this.scene = scene;
      this.layer = layer;
      this.lineGraphics = scene.add.graphics();
      this.line = new Phaser.Geom.Line(0, 0, 0, 0);
      this.x = x - this.offsetX;
      this.y = y - this.offsetY;
      this.lineGraphics.setDepth(999);
   }

   adjustPosition(
      target1: {
         x: number;
         y: number;
      },
      target2: {
         x: number;
         y: number;
      }
   ) {
      this.x = target1.x - this.offsetX;
      this.y = target1.y - this.offsetY;

      this.lineGraphics.clear();

      this.line.setTo(target1.x, target1.y, target2.x, target2.y);
      this.points = this.line.getPoints(TILESIZE);

      let counter = 0;

      for (var i = 0; i < this.points.length; i++) {
         var p = this.points[i];
         const tile = this.layer.getTileAtWorldXY(p.x - 2, p.y - 2);
         if (tile && tile.properties && tile.properties.collides) {
            this.lineGraphics.fillStyle(0x00ffff, this.lineOpacity);
            counter++;
         } else {
            this.lineGraphics.fillStyle(0xff0000, this.lineOpacity);
         }
         this.lineGraphics.fillRect(p.x - 2, p.y - 2, 4, 4);
      }

      this.overlap = counter > 0;
   }

   clearLine() {
      this.lineGraphics.clear();
   }
}
