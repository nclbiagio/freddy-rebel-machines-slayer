import { Animations, Scene } from 'phaser';
import { MagnetGunModel, MagnetGunSprite } from '../sprites/MagnetGun';
import { EntityModel } from '../models/Entity';
import { AnimationService } from '../core/graphics/AnimationService';

export class MagnetGunEntity extends MagnetGunSprite {
   static key = 'magnetGun';

   constructor(scene: Scene, props: EntityModel) {
      super(scene, props);
   }

   static create(scene: Scene, props: { x: number; y: number }, model?: Partial<MagnetGunModel>): MagnetGunEntity {
      const entity = new MagnetGunEntity(scene, { id: self.crypto.randomUUID(), key: MagnetGunEntity.key, ...props });
      if (model) {
         entity.setModel(model);
      }
      entity.setAnimations(scene.anims);
      entity.setBody();
      return entity;
   }

   static loadSpritesheet(scene: Scene) {
      // Carichiamo lo sprite minimale appena generato (32x16 un frame base)
      scene.load.spritesheet(MagnetGunEntity.key, `spritesheet/${MagnetGunEntity.key}.png`, { frameWidth: 32, frameHeight: 16 });
   }

   setBody() {
      this.setWeaponBody();

      if (this.body) {
         // L'arma è fissa al petto di Freddy, non c'è gravità nè barriere che devon toccare l'arma
         this.body.setAllowGravity(false);
         this.body.setCollideWorldBounds(false);
      }
   }

   setAnimations(sceneAnims: Animations.AnimationManager) {
      const as = AnimationService.getInstance();
      if (!as.animationIsAdded(MagnetGunEntity.key)) {
         // Placeholder: eventuali animazioni dell'arma quando spara la carica magnetica
         // sceneAnims.create({ key: `${MagnetGunEntity.key}Fire` ... });
         as.addAnimation(MagnetGunEntity.key);
      }
   }
}
