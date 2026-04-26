import { Scene, GameObjects, Physics, Animations } from 'phaser';
import { EntityModel } from '../models/Entity';
import { AnimationService } from '../core/graphics/AnimationService';

export interface BouncyGooModel extends EntityModel {
   bounceForce: number;
}

export class BouncyGoo extends Physics.Arcade.Sprite {
   static key = 'bouncy_goo';
   declare body: Physics.Arcade.Body;
   model: BouncyGooModel;

   constructor(scene: Scene, props: EntityModel) {
      super(scene, props.x, props.y, BouncyGoo.key);
      scene.add.existing(this);
      scene.physics.add.existing(this);

      this.model = {
         bounceForce: -850,
         ...props,
      } as BouncyGooModel;

      this.body.setImmovable(true);
      this.body.setAllowGravity(false);
      
      // Hitbox leggermente ridotta per evitare collisioni laterali fastidiose
      this.body.setSize(24, 16);
      this.body.setOffset(4, 16);

      this.setDepth(10);
      this.setupAnimations(scene.anims);
   }

   static create(scene: Scene, props: { x: number; y: number }, model?: Partial<BouncyGooModel>): BouncyGoo {
      const entity = new BouncyGoo(scene, { id: self.crypto.randomUUID(), key: BouncyGoo.key, ...props });
      if (model) {
         entity.model = { ...entity.model, ...model };
      }
      return entity;
   }

   static loadSpritesheet(scene: Scene) {
      scene.load.spritesheet(BouncyGoo.key, `spritesheet/lv2/${BouncyGoo.key}.png`, {
         frameWidth: 32,
         frameHeight: 32,
      });
   }

   private setupAnimations(sceneAnims: Animations.AnimationManager) {
      const as = AnimationService.getInstance();
      if (!as.animationIsAdded(BouncyGoo.key)) {
         sceneAnims.create({
            key: `${BouncyGoo.key}Idle`,
            frames: sceneAnims.generateFrameNumbers(BouncyGoo.key, { start: 0, end: 3 }),
            frameRate: 6,
            repeat: -1,
         });

         sceneAnims.create({
            key: `${BouncyGoo.key}Bounce`,
            frames: sceneAnims.generateFrameNumbers(BouncyGoo.key, { start: 4, end: 7 }),
            frameRate: 15,
            repeat: 0,
         });

         as.addAnimation(BouncyGoo.key);
      }
      this.play(`${BouncyGoo.key}Idle`);
   }

   public bounce() {
      this.play(`${BouncyGoo.key}Bounce`, true);
      this.once('animationcomplete', () => {
         this.play(`${BouncyGoo.key}Idle`);
      });
   }
}
