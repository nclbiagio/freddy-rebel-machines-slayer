import { CableSprite, CableModel as BaseCableModel } from '../sprites/Cable';
import { BaseScene } from '../scenes/_template/BaseScene';
import { AnimationService } from '../core/graphics/AnimationService';
import { EntityModel } from '../models/Entity';
import { Scene } from 'phaser';

export interface CableModel extends BaseCableModel {
   // Eventuali estensioni future del modello specifiche per CableEntity (es. suoni, riferimenti)
}

export class CableEntity extends CableSprite {
   declare model: CableModel;

   static override key = 'cable';

   constructor(scene: Scene, props: EntityModel) {
      super(scene, props);
   }

   // Metodo per la creazione rapida
   static create(scene: Scene, props: { x: number; y: number }, model?: Partial<CableModel>): CableEntity {
      // Passiamo subito il model dentro alle props per il costruttore padre, così
      // il setup base di Cable.ts cattura correttamente la maxLength da Tiled!
      const entity = new CableEntity(scene, { 
          id: self.crypto.randomUUID(), 
          key: `${CableEntity.key}`, 
          ...props,
          ...model
      });
      
      if (model) {
         entity.setModel(model);
      }
      // Se il cavo avrà animazioni per la spina metallica (es scintille o glow)
      entity.setAnimations(scene.anims);
      
      return entity;
   }

   static loadSpritesheet(scene: Scene) {
      // Carichiamo la testina metallica del cavo (16x16)
      scene.load.spritesheet(CableEntity.key, `spritesheet/${CableEntity.key}.png`, { frameWidth: 16, frameHeight: 16 });
   }

   setAnimations(sceneAnims: Phaser.Animations.AnimationManager) {
      const as = AnimationService.getInstance();
      if (!as.animationIsAdded(CableEntity.key)) {
         // Placeholder in caso aggiungessimo stati visivi diversi (es. idle vs active glow)
         /*
         const animations = [
            {
               key: `${CableEntity.key}Idle`,
               frames: sceneAnims.generateFrameNumbers(`${this.model.key}`, { start: 0, end: 0 }),
               frameRate: 1,
               repeat: 0,
            }
         ];
         animations.forEach((animation) => sceneAnims.create(animation));
         */
         as.addAnimation(CableEntity.key);
      }
   }
}
