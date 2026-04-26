import { RebelMachineSprite, RebelMachineModel } from '../sprites/RebelMachine';
import { Scene } from 'phaser';
import { EntityModel } from '../models/Entity';

export interface RebelMachineEntityModel extends RebelMachineModel {}

export class MachineEntity extends RebelMachineSprite {
   static key = 'machine';

   constructor(scene: Scene, props: EntityModel) {
      super(scene, props);
   }

   static create(scene: Scene, props: { x: number; y: number }, model?: Partial<RebelMachineEntityModel>): MachineEntity {
      const entity = new MachineEntity(scene, { id: self.crypto.randomUUID(), key: MachineEntity.key, ...props });
      if (model) {
         entity.setModel(model);
      }
      return entity;
   }

   static loadSpritesheet(scene: Scene) {
      scene.load.image(MachineEntity.key, `spritesheet/${MachineEntity.key}.png`);
   }
}
