import { RebelMachineSprite, RebelMachineModel } from '../sprites/RebelMachine';
import { Scene } from 'phaser';
import { EntityModel } from '../models/Entity';

export class WashingMachineEntity extends RebelMachineSprite {
   static key = 'washing_machine';

   constructor(scene: Scene, props: EntityModel) {
      // Definiamo 1 socket centrale sull'oblò (compensando l'offset LED di -12px)
      const socketsConfig = [
         { x: 32, y: 62, id: 1 },
      ];
      super(scene, props, socketsConfig);
      
      this.setDepth(10);
      if (this.body) {
         this.body.setSize(56, 68); // Hitbox leggermente più stretta dell'immagine
         this.body.setOffset(4, 12);
      }
   }

   static create(scene: Scene, props: { x: number; y: number }, model?: Partial<RebelMachineModel>): WashingMachineEntity {
      const entity = new WashingMachineEntity(scene, { id: self.crypto.randomUUID(), key: WashingMachineEntity.key, ...props });
      if (model) {
         entity.setModel(model);
      }
      return entity;
   }

   static loadSpritesheet(scene: Scene) {
      scene.load.image(WashingMachineEntity.key, `spritesheet/${WashingMachineEntity.key}.png`);
   }

   override update() {
      super.update();

      // Comportamento Unico: Centrifuga Impazzita (Shake)
      if (!this.model.isSolved) {
         // Aggiungiamo un piccolo offset randomico per simulare vibrazione
         const shakeX = (Math.random() - 0.5) * 2.5;
         this.setX(this.x + shakeX);
         
         // Torniamo verso la posizione base dolcemente (per non farla scivolare via)
         this.scene.time.delayedCall(16, () => {
            if (this.active) {
               this.setX(this.x - shakeX);
            }
         });
      }
   }
}
