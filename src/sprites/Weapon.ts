import { GameObjects, Physics, Scene } from 'phaser';
import { Direction, EntityModel } from '../models/Entity';
import { BulletSprite } from './Bullet';
import { PLAYER_DEPTH } from './Player';

export type Status = 'idle' | 'active' | 'fire' | 'dead';

export interface WeaponModel extends EntityModel {
   status: Status;
   pos: { x: number; y: number };
   offset: { x: number; y: number };
   directionalOffsets?: Partial<Record<Direction, { x: number; y: number }>>;
   name: string;
   hasBullets: boolean;
   type: string | null;
   consumeWeaponPowerCallback?: (() => void) | null | undefined;
   category: string;
   lastAbsorbTime: number;
}

export class WeaponSprite extends Physics.Arcade.Sprite {
   model: WeaponModel;
   declare body: Physics.Arcade.Body;
   constructor(scene: Scene, props: EntityModel) {
      super(scene, props.x, props.y, props.key);
      scene.add.existing(this);
      scene.physics.add.existing(this);
      this.model = {
         status: 'idle',
         pos: { x: props.x, y: props.y },
         offset: { x: 0, y: 0 }, // px
         hasBullets: false,
         name: `weapon_${self.crypto.randomUUID()}`,
         type: null,
         category: 'weapon',
         lastAbsorbTime: 0,
         ...props,
      };
   }

   setWeaponBody(animationcompleteCallback?: (animation: string) => void) {
      //this.setScale(0.7, 1);
      this.on(
         'animationcomplete',
         (animation: { key: string }) => {
            if (animationcompleteCallback) {
               animationcompleteCallback(animation.key);
            }
         },
         this
      );
      this.body.setVelocity(0, 0);
      this.body.setCollideWorldBounds(true);
      this.setDepth(PLAYER_DEPTH + 1);
      this.setPipeline('Light2D');
      this.setWeaponVisible(true);
   }

   setModel<T extends WeaponModel>(model: Partial<T>) {
      this.model = {
         ...this.model,
         ...model,
      };
   }

   setWeaponVisible(active: boolean) {
      this.active = active;
      this.setVisible(this.active);
      if (this.active && this.visible) {
         this.setPosition(this.model.pos.x, this.model.pos.y);
      }
   }

   override update(
      x: number,
      y: number,
      vel: Phaser.Math.Vector2,
      direction: Direction,
      _playerStatus?: string,
      _time?: number,
      _lastMouseButton?: 'right' | 'left' | null
   ) {
      let yOffset = 0;
      let xOffset = 0;
      if (this.model.status === 'dead') {
         this.setWeaponVisible(false);
         this.destroyWeapon();
      }
      if (this.model.status === 'active' || this.model.status === 'fire') {
         // Depth Sorting
         if (direction === Direction.UP) {
            // console.log('UP: Setting depth behind', PLAYER_DEPTH - 10);
            this.setDepth(PLAYER_DEPTH - 10);
         } else {
            // console.log('OTHER: Setting depth front', PLAYER_DEPTH + 10);
            this.setDepth(PLAYER_DEPTH + 10);
         }
         /* // Debug log
         if (this.scene.game.loop.frame % 60 === 0) {
            console.log(`Weapon Update - Dir: ${direction}, Depth: ${this.depth}, PlayerDepth: ${PLAYER_DEPTH}`);
         } */

         let currentOffset = this.model.offset;

         // Dynamic Directional Offsets
         if (this.model.directionalOffsets && this.model.directionalOffsets[direction]) {
            currentOffset = this.model.directionalOffsets[direction]!;
         }

         switch (direction) {
            case Direction.LEFT:
               xOffset = -currentOffset.x;
               this.angle = 180;
               break;
            case Direction.RIGHT:
               xOffset = currentOffset.x;
               this.angle = 360;
               break;
            case Direction.UP:
               yOffset = -currentOffset.y;
               this.angle = -90;
               break;
            case Direction.DOWN:
               yOffset = currentOffset.y;
               this.angle = 90;
               break;
            default:
               break;
         }
         this.body.setVelocity(vel.x, vel.y);
         this.setPosition(x + xOffset, y + yOffset);
      }
   }

   fireBullet(bullets: Phaser.GameObjects.Group, facing: { x: number; y: number }, direction: Direction) {
      if (this.model.hasBullets) {
         const bulletFromGroup = bullets.getFirstDead();
         const bullet = bulletFromGroup as BulletSprite;
         if (bullet) {
            bullet.init();
            bullet.fireFromPlayer(this.x, this.y, facing, direction);
         }
      }
   }

   calculateDamage(type: string): number {
      throw new Error(`Method 'calculateDamage' must be implemented in subclass for weapon type: ${this.model.type}, action: ${type}`);
   }

   destroyWeapon() {
      this.destroy();
   }
}
