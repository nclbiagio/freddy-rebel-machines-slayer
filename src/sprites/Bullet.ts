import { GameObjects, Physics, Scene } from 'phaser';
import { Direction, EntityModel } from '../models/Entity';
import { ExplosionService } from '../core/graphics/Explosion';
import { TILESIZE } from '../GameService';

export type Status = 'inactive' | 'active' | 'explode' | 'dead';

export interface BulletModel extends EntityModel {
   status: Status;
   defaultVel: number;
   direction: Direction;
   type: string;
   damage: number;
}

export class BulletSprite extends Physics.Arcade.Sprite {
   model: BulletModel;
   declare body: Physics.Arcade.Body;
   #explosionService: ExplosionService | null = null;
   constructor(scene: Scene, props: EntityModel) {
      super(scene, props.x, props.y, props.key);
      scene.add.existing(this);
      scene.physics.add.existing(this);
      this.model = {
         status: 'inactive',
         defaultVel: 80,
         direction: Direction.NONE,
         type: 'bullet',
         damage: 1,
         ...props,
      };
      this.active = false;
      if (scene) {
         this.#explosionService = ExplosionService.getInstance(scene);
      }
   }

   setBulletBody(animationcompleteCallback?: (animation: string) => void) {
      this.on(
         'animationcomplete',
         (animation: { key: string }) => {
            if (animationcompleteCallback) {
               animationcompleteCallback(animation.key);
            }
         },
         this
      );
      this.setActive(false);
      this.setVisible(false);
      this.setPosition(this.model.x, this.model.y);
      this.setPipeline('Light2D');
      //this.body.setCollideWorldBounds(true);
   }

   setModel<T extends BulletModel>(model: Partial<T>) {
      this.model = {
         ...this.model,
         ...model,
      };
   }

   init() {
      this.setActive(true);
      this.setVisible(true);
      this.setModel({
         status: 'active',
      });
   }

   fireFromEnemy(x: number, y: number, targetX: number, targetY: number, damage: number = 1) {
      this.setModel({
         damage,
      });
      if (!!targetX && !!targetY) {
         const angle = Phaser.Math.Angle.Between(x, y, targetX, targetY);
         this.rotation = angle;
      }
      const velocityX = Math.cos(this.rotation) * this.model.defaultVel;
      const velocityY = Math.sin(this.rotation) * this.model.defaultVel;
      this.body.setVelocity(velocityX, velocityY);
      this.setPosition(x, y);
   }

   fireFromPlayer(x: number, y: number, facing: { x: number; y: number }, direction: Direction) {
      let velocityX = this.model.defaultVel;
      let velocityY = this.model.defaultVel;
      const facingX = facing.x || 1;
      const facingY = facing.y || 1;

      switch (direction) {
         case Direction.LEFT:
         case Direction.RIGHT:
            velocityY = 0;
            break;

         case Direction.UP:
         case Direction.DOWN:
            velocityX = 0;
            break;

         default:
            break;
      }

      this.body.setVelocity(velocityX * facingX, velocityY * facingY);
      this.setPosition(x, y);
   }

   override update(_time: number) {
      if (this.active && this.visible && this.model.status === 'active') {
         if (this.body.checkWorldBounds()) {
            this.dead();
         }
      }
   }

   deadExplosion() {
      const explosion = this.#explosionService?.getByType(this.model.type);
      if (explosion && explosion.particleEmitter) {
         if (!explosion.particleEmitter.visible) {
            explosion.particleEmitter.setVisible(true);
         }
         explosion.particleEmitter.setPosition(this.x, this.y);
         explosion.particleEmitter.start();
         this.scene.time.delayedCall(100, () => {
            explosion.particleEmitter?.stop();
            //sceneParticleEmitter.setVisible(false);
         });
      } else {
         console.log(`Provided ${this.model.type} explosion doesn't not exists`);
      }
   }

   dead() {
      this.deadExplosion();
      //console.log(`bullet ${this.model.id} dead`);
      this.setActive(false);
      this.setVisible(false);
      this.setModel({
         status: 'dead',
      });
      this.body.velocity.x = 0;
      this.body.velocity.y = 0;
      this.setPosition(TILESIZE, TILESIZE);
   }

   setBulletVisible(active: boolean) {
      this.active = active;
      this.setVisible(this.active);
   }

   destroyBullet() {
      this.destroy();
   }
}
