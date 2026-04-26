import { GameObjects, Scene } from 'phaser';
import { TILESIZE } from '../GameService';

export class PathLine {
   scene: Scene;
   pathLine: GameObjects.Graphics;
   x: number;
   y: number;
   offsetX = 0;
   offsetY = 0;
   constructor(scene: Scene, x: number, y: number) {
      this.scene = scene;
      this.pathLine = scene.add.graphics();
      this.x = x - 20;
      this.y = y - 20;
      this.pathLine.setDepth(4);
      //this.draw();
      this.pathLine.setDepth(999);
   }

   adjustPosition(
      path: {
         x: number;
         y: number;
      }[],
      x: number,
      y: number
   ) {
      this.x = x - this.offsetX;
      this.y = y - this.offsetY;
      this.clearPathLine();
      this.pathLine.beginPath();
      this.pathLine.lineStyle(2, 0xff0000, 1.0);
      this.pathLine.moveTo(x, y);
      path.forEach((point) => {
         const pointX = point.x * TILESIZE + TILESIZE / 2;
         const pointY = point.y * TILESIZE + TILESIZE / 2;
         this.pathLine.lineTo(pointX, pointY);
      });
      //this.pathLine.closePath();
      this.pathLine.strokePath();
   }

   clearPathLine() {
      this.pathLine.clear();
   }
}
