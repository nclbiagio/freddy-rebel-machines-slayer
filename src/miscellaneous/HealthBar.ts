import { Scene } from 'phaser';

export class HealthBar {
   scene: Scene;
   bar: Phaser.GameObjects.Graphics;
   x: number = 0;
   y: number = 0;
   width: number;
   height: number;
   maxHealth: number;
   value: number;
   p: number;

   constructor(scene: Scene, x: number, y: number, value = 100, maxHealth = 100) {
      this.scene = scene;
      this.maxHealth = maxHealth;
      this.value = value;

      const visualScale = 5;
      this.width = maxHealth * visualScale;
      this.height = 4;
      this.p = this.width / this.maxHealth;

      this.bar = scene.add.graphics();
      this.setPosition(x, y);
   }

   draw() {
      this.bar.clear();

      // Bordo nero
      this.bar.fillStyle(0x000000);
      this.bar.fillRect(this.x, this.y, this.p * this.value, this.height);

      // Colore in base alla salute
      const healthPercentage = this.value / this.maxHealth;
      let color = 0x00ff00;
      if (healthPercentage <= 0.7 && healthPercentage > 0.3) {
         color = 0xffff00;
      } else if (healthPercentage <= 0.3) {
         color = 0xff0000;
      }

      // Barra interna
      this.bar.fillStyle(color);
      this.bar.fillRect(this.x, this.y, this.p * this.value, this.height);
   }

   decrease(amount: number) {
      const newValue = Phaser.Math.Clamp(this.value - amount, 0, this.maxHealth);

      this.scene.tweens.add({
         targets: this,
         value: newValue,
         duration: 200,
         onUpdate: () => this.draw(),
         onComplete: () => {
            this.value = newValue;
            if (this.value <= 0) {
               this.destroy();
            }
         },
      });
   }

   setPosition(centerX: number, centerY: number) {
      // Posiziona la barra centrata sopra il nemico
      this.x = centerX - this.width / 2;
      this.y = centerY - 30;
      this.draw();
   }

   destroy() {
      this.scene.tweens.add({
         targets: this.bar,
         alpha: 0,
         duration: 500,
         onComplete: () => this.bar.destroy(),
      });
   }
}
