import { Animations, Scene } from 'phaser';
import { EntityModel } from '../models/Entity';
import { AnimationService } from '../core/graphics/AnimationService';

export class CarLift extends Phaser.Physics.Arcade.Sprite {
   static key = 'car_lift';
   declare body: Phaser.Physics.Arcade.Body;

   private liftState: 'waiting_down' | 'rising' | 'waiting_up' | 'lowering' = 'waiting_down';
   private timer: number = 0;
   private readonly waitTime: number = 2000;
   
   private previousOffset: number = 108;
   public verticalDelta: number = 0;

   constructor(scene: Scene, props: EntityModel & { initialState?: CarLift['liftState'] }) {
      super(scene, props.x, props.y, CarLift.key);
      
      scene.add.existing(this);
      scene.physics.add.existing(this, false); // Dynamic body for better interaction
      
      if (this.body) {
         this.body.setImmovable(true);
         this.body.setAllowGravity(false);
         this.body.checkCollision.down = true;
         this.body.checkCollision.left = true;
         this.body.checkCollision.right = true;
      }

      this.setDepth(5);
      this.setAnimations(scene.anims);
      
      if (this.body) {
         this.body.setSize(110, 15); // Hitbox sottile per fedeltà visiva
         this.body.setOffset(9, 108);
      }

      if (props.initialState) {
         this.liftState = props.initialState;
      }

      this.play(this.liftState === 'waiting_up' ? 'lift_idle_up' : 'lift_idle_down');
   }

   static create(scene: Scene, props: { x: number; y: number; initialState?: CarLift['liftState'] }): CarLift {
      return new CarLift(scene, { id: self.crypto.randomUUID(), key: CarLift.key, ...props });
   }

   static loadSpritesheet(scene: Scene) {
      scene.load.spritesheet(CarLift.key, `spritesheet/${CarLift.key}.png`, {
         frameWidth: 128,
         frameHeight: 128,
      });
   }

   private setAnimations(sceneAnims: Animations.AnimationManager) {
      const as = AnimationService.getInstance();
      if (!as.animationIsAdded(CarLift.key)) {
         sceneAnims.create({
            key: 'lift_rise',
            frames: sceneAnims.generateFrameNumbers(CarLift.key, { start: 0, end: 7 }),
            frameRate: 10,
            repeat: 0,
         });
         sceneAnims.create({
            key: 'lift_lower',
            frames: sceneAnims.generateFrameNumbers(CarLift.key, { start: 7, end: 0 }),
            frameRate: 10,
            repeat: 0,
         });
         sceneAnims.create({
            key: 'lift_idle_down',
            frames: [{ key: CarLift.key, frame: 0 }],
         });
         sceneAnims.create({
            key: 'lift_idle_up',
            frames: [{ key: CarLift.key, frame: 7 }],
         });
         as.addAnimation(CarLift.key);
      }
   }

   private frameOffsets = [112, 102, 92, 81, 71, 61, 50, 40];

   override update(time: number, delta: number) {
      super.update(time, delta);

      switch (this.liftState) {
         case 'waiting_down':
            this.timer += delta;
            if (this.timer >= this.waitTime) {
               this.timer = 0;
               this.liftState = 'rising';
               this.play('lift_rise');
            }
            break;

         case 'rising':
            if (!this.anims.isPlaying) {
               this.liftState = 'waiting_up';
               this.play('lift_idle_up');
            }
            break;

         case 'waiting_up':
            this.timer += delta;
            if (this.timer >= this.waitTime) {
               this.timer = 0;
               this.liftState = 'lowering';
               this.play('lift_lower');
            }
            break;

         case 'lowering':
            if (!this.anims.isPlaying) {
               this.liftState = 'waiting_down';
               this.play('lift_idle_down');
            }
            break;
      }

      if (this.body && this.anims.currentFrame) {
         const frameValue = parseInt(this.anims.currentFrame.frame.name);
         const newOffset = this.frameOffsets[frameValue] || 112;
         
         // Calcoliamo la differenza di movimento per i "passeggeri" (Freddy)
         this.verticalDelta = newOffset - this.previousOffset;
         this.previousOffset = newOffset;
         
         this.body.setOffset(9, newOffset);
      } else {
         this.verticalDelta = 0;
      }
   }
}
