import { RebelMachineSprite, RebelMachineModel } from '../sprites/RebelMachine';
import { Scene } from 'phaser';
import { EntityModel } from '../models/Entity';

export class DroneEntity extends RebelMachineSprite {
   static key = 'drone';

   constructor(scene: Scene, props: EntityModel, socketsConfig?: Array<{ x: number; y: number; id: number }>) {
      // 1 solo socket centrale (su corpo 48x48)
      const finalSockets = socketsConfig !== undefined ? socketsConfig : [
         { x: 24, y: 32, id: 1 },
      ];
      super(scene, props, finalSockets);
      
      this.setDepth(10);
      if (this.body) {
         this.body.setSize(32, 24);
         this.body.setOffset(8, 12);
         this.body.setAllowGravity(false); // Vola!
         this.body.setImmovable(false); // Può essere urtato ma fluttua
      }
   }

   static create(scene: Scene, props: { x: number; y: number }, model?: Partial<RebelMachineModel>, socketsConfig?: Array<{ x: number; y: number; id: number }>): DroneEntity {
      const entity = new DroneEntity(scene, { id: self.crypto.randomUUID(), key: DroneEntity.key, ...props }, socketsConfig);
      if (model) {
         entity.setModel(model);
      }
      return entity;
   }

   static loadSpritesheet(scene: Scene) {
      scene.load.image(DroneEntity.key, `spritesheet/${DroneEntity.key}.png`);
   }

   override update() {
      super.update();

      // Comportamento Unico: Hovering (Fluttuazione)
      if (!this.model.isSolved) {
         // Oscilla su e giù dolcemente
         const hoverOffset = Math.sin(this.scene.time.now / 500) * 0.5;
         this.setY(this.y + hoverOffset);
         
         // Leggera rotazione durante il volo per realismo
         const tilt = Math.sin(this.scene.time.now / 1000) * 2;
         this.setAngle(tilt);
      } else {
         // Se risolto, si stabilizza (o potrebbe cadere, ma per ora lo lasciamo fermo)
         this.setAngle(0);
         if (this.body.allowGravity === false) {
            // Se vuoi che cada al suolo una volta aggiustato:
            // this.body.setAllowGravity(true);
         }
      }
   }
}
