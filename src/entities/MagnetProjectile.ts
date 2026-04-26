import { Animations, Physics, Scene } from 'phaser';
import { BulletSprite, BulletModel } from '../sprites/Bullet';
import { EntityModel } from '../models/Entity';
import { TILESIZE } from '../GameService';
import { AnimationService } from '../core/graphics/AnimationService';
import { MagnetGunSprite } from '../sprites/MagnetGun';

export type MagnetProjectileState = 'outward' | 'retracting';

export interface MagnetProjectileModel extends BulletModel {}

export class MagnetProjectile extends BulletSprite {
   static key = 'magnetProjectile';
   declare model: MagnetProjectileModel;

   private projectileState: MagnetProjectileState = 'outward';
   private ownerGun?: MagnetGunSprite;
   private startX: number = 0;
   private startY: number = 0;
   private maxRange: number = 300;

   constructor(scene: Scene, props: EntityModel) {
      super(scene, props);
   }

   static create(scene: Scene, props: { x: number; y: number }, model?: Partial<MagnetProjectileModel>): MagnetProjectile {
      const entity = new MagnetProjectile(scene, { id: self.crypto.randomUUID(), key: `${MagnetProjectile.key}`, ...props });
      if (model) {
         entity.setModel(model);
      }
      entity.setAnimations(scene.anims);
      entity.setBody();
      return entity;
   }

   static loadSpritesheet(scene: Scene) {
      scene.load.spritesheet(`${MagnetProjectile.key}`, `spritesheet/${MagnetProjectile.key}.png`, {
         frameWidth: TILESIZE,
         frameHeight: TILESIZE,
      });
   }

   setBody() {
      const setOnCompleteAnimationCallback = (animationkey: string) => {
         if (animationkey === `${this.model.key}Explode`) {
            this.setFireBallModel({ status: 'dead' });
         }
      };
      this.setBulletBody(setOnCompleteAnimationCallback);
      this.body.setAllowGravity(false);
      this.body.setCollideWorldBounds(true);
      
      // Ridimensioniamo l'hitbox: una pallina da 12x12 al centro di un frame da 32x32
      this.body.setSize(12, 12);
      this.body.setOffset(10, 10);
      
      this.body.onWorldBounds = true;

      this.scene.physics.world.on('worldbounds', (body: Physics.Arcade.Body) => {
         if (body.gameObject === this) {
            this.startRetracting();
         }
      });
   }

   setFireBallModel<T extends MagnetProjectileModel>(model: Partial<T>) {
      this.model = {
         ...this.model,
         ...model,
      };
   }

   setAnimations(sceneAnims: Animations.AnimationManager) {
      const as = AnimationService.getInstance();
      if (!as.animationIsAdded(MagnetProjectile.key)) {
         const animations = [
            {
               key: `${this.model.key}Fire`,
               frames: sceneAnims.generateFrameNumbers(`${this.model.key}`, { start: 0, end: 4 }),
               frameRate: 12,
               repeat: -1,
            },
            //TODO fireExplosion animation, for now I'm using particle emitter
            /* {
                key: 'fireExplosion',
                frames: sceneAnims.generateFrameNumbers(`${this.model.key}`, { start: 5, end: 9 }),
                frameRate: 12,
                repeat: 0,
             }, */
         ];
         animations.forEach((animation) => {
            sceneAnims.create(animation);
         });
         as.addAnimation(MagnetProjectile.key);
      }
   }

   fireAtAngle(x: number, y: number, angle: number, ownerGun?: MagnetGunSprite, range?: number) {
      this.setActive(true);
      this.setVisible(true);
      this.setPosition(x, y);
      this.rotation = angle;
      
      this.startX = x;
      this.startY = y;
      this.projectileState = 'outward';
      this.ownerGun = ownerGun;
      this.maxRange = range || 300;
      
      this.setModel({ status: 'active' });

      const velocityX = Math.cos(angle) * this.model.defaultVel;
      const velocityY = Math.sin(angle) * this.model.defaultVel;

      this.body.setVelocity(velocityX, velocityY);

      // Avviamo l'animazione di volo magnetico
      this.anims.play(`${this.model.key}Fire`, true);
   }

   public startRetracting() {
      if (this.projectileState === 'retracting' || !this.active) return;
      this.projectileState = 'retracting';
      this.body.setVelocity(0, 0);
   }

   override update(time: number) {
      if (!this.active || this.model.status !== 'active') return;

      if (this.ownerGun) {
         // Calcoliamo dove si trova la punta della pistola attualmente
         const barrelLength = 26;
         const tipX = this.ownerGun.x + Math.cos(this.ownerGun.rotation) * barrelLength;
         const tipY = this.ownerGun.y + Math.sin(this.ownerGun.rotation) * barrelLength;

         if (this.projectileState === 'outward') {
            // Calcoliamo la distanza dalla punta della pistola (non dal punto di partenza statico)
            const distance = Phaser.Math.Distance.Between(this.x, this.y, tipX, tipY);
            if (distance >= this.maxRange) {
               this.startRetracting();
            }
         } else if (this.projectileState === 'retracting') {
            const distanceToGun = Phaser.Math.Distance.Between(this.x, this.y, tipX, tipY);
            
            if (distanceToGun < 15) {
               this.dead();
            } else {
               const angleToGun = Phaser.Math.Angle.Between(this.x, this.y, tipX, tipY);
               // Velocità di rientro molto più alta per essere sicuri che raggiunga Freddy
               const returnSpeed = 600; 
               this.body.setVelocity(Math.cos(angleToGun) * returnSpeed, Math.sin(angleToGun) * returnSpeed);
               this.rotation = angleToGun;
            }
         }
      } else if (this.projectileState === 'outward') {
         // Fallback se per qualche motivo non c'è la pistola
         const distance = Phaser.Math.Distance.Between(this.x, this.y, this.startX, this.startY);
         if (distance >= this.maxRange) {
            this.dead();
         }
      }
   }

   override dead() {
      super.dead();
      this.projectileState = 'outward';
      if (this.ownerGun && (this.ownerGun as any).clearActiveProjectile) {
         (this.ownerGun as any).clearActiveProjectile();
      }
   }
}
