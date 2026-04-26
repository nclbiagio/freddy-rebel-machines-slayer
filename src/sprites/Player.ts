import { GameObjects, Physics, Scene } from 'phaser';
import { Direction, EntityModel } from '../models/Entity';
import { Cursors, SharedEnemyData } from '../models/Game';
import { GameService, TILESIZE } from '../GameService';
import { EventBus } from '../EventBus';
import { PlayerStateService } from '../game/state/PlayerState';

export type Status = 'idle' | 'run' | 'fire' | 'jump' | 'hit' | 'dead' | 'crushed';
//fire has become only a status meant for fire animation, canShoot is the real responsibile for the bullet firing

export const ORIGIN_PLAYER_VEL = 140; //slower is velocity, smoother seems the game, originally was 160
export const ORIGIN_PLAYER_lIVES = 10;
export const PLAYER_DEPTH = 99;

export const currentGameType = GameService.getInstance().type;

export interface PlayerModel extends EntityModel {
   lives: number;
   defaultVel: number;
   facingX: number;
   facingY: number;
   status: Status;
   penalty: 'none' | 'hasSlowPenalty' | 'hasExtremeSlowPenalty';
   updateTime: number;
   direction: Direction;
   hasWeapon: boolean;
   shootDelay: number;
   shootTimer: number;
   canShoot: boolean;
   hitDelay: number;
   hitTimer: number;
   penaltyDelay: number; //milliseconds
   penaltyTimer: number;
   lastDashTime: number;
   dashCooldown: number;
   enableDash: boolean;
   enablePointerShadow: boolean;
   enableTrail: boolean;
   isAbleToInteract: boolean;
   enableShadow: boolean;
   enableExperienceEncrease: boolean;
}

export class PlayerSprite extends Physics.Arcade.Sprite {
   #gameService = GameService.getInstance();
   model: PlayerModel;
   declare body: Physics.Arcade.Body;
   cursors: Cursors;
   emitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
   shadow: GameObjects.Graphics | null = null;
   onEnemyDead: ((data: SharedEnemyData) => void) | null = null;
   constructor(scene: Scene, props: EntityModel) {
      super(scene, props.x, props.y, props.key);
      scene.add.existing(this);
      scene.physics.add.existing(this);

      this.shadow = scene.add.graphics();

      this.model = {
         lives: ORIGIN_PLAYER_lIVES,
         defaultVel: ORIGIN_PLAYER_VEL,
         facingX: 1, // -1 left 1 right
         facingY: 1,
         status: 'idle',
         penalty: 'none',
         updateTime: 0,
         direction: Direction.NONE,
         hasWeapon: false,
         shootDelay: 500,
         shootTimer: 0,
         canShoot: false,
         hitDelay: 500, //milliseconds
         hitTimer: 0,
         penaltyDelay: 1000, //milliseconds
         penaltyTimer: 0,
         enablePointerShadow: false,
         enableTrail: false,
         enableDash: false,
         lastDashTime: 0,
         dashCooldown: 1000,
         isAbleToInteract: true,
         enableShadow: false,
         enableExperienceEncrease: false,
         ...props,
      };

      this.cursors = this.createCursorKeys();

      if (this.model.enableTrail) {
         // Creazione particelle e emitter
         this.emitter = scene.add.particles(0, 0, 'particle', {
            speed: 0,
            scale: { start: 0.5, end: 0 },
            alpha: { start: 0.5, end: 0 },
            lifespan: 300,
            frequency: 50,
            follow: this,
            tint: { start: 0xffffff, end: 0x000000 },
         });
      }
   }

   setPlayerBody(animationcompleteCallback?: (animation: string) => void): void {
      this.on(
         'animationcomplete',
         (animation: { key: string }) => {
            if (animationcompleteCallback) {
               animationcompleteCallback(animation.key);
            }
         },
         this
      );
      this.setPosition(this.model.x, this.model.y);
      this.body.setBounce(0.2, 0.2);
      this.body.setCollideWorldBounds(true);
      this.setDepth(PLAYER_DEPTH);
      this.setAlpha(1);
      if (this.model.enablePointerShadow) {
         this.setPointerShadow();
      }
      if (this.model.enableShadow && !this.model.enablePointerShadow) {
         this.setShadow();
      }
      if (this.model.enableExperienceEncrease) {
         if (this.onEnemyDead) {
            EventBus.off(`enemy-dead`, this.onEnemyDead);
         }
         this.onEnemyDead = (enemyData: SharedEnemyData) => {
            console.log('You have killed an enemy', enemyData);
            const playerService = PlayerStateService.getInstance();
            playerService.addXp(enemyData.experience);
         };
         EventBus.on(`enemy-dead`, this.onEnemyDead);
      }
      this.setPipeline('Light2D');
   }

   setPointerShadow() {
      if (this.shadow) {
         const points = [
            new Phaser.Math.Vector2(0, -TILESIZE * 0.6), // punta in alto
            new Phaser.Math.Vector2(TILESIZE * 0.3, TILESIZE * 0.3), // lato destro
            new Phaser.Math.Vector2(0, TILESIZE * 0.5), // fondo
            new Phaser.Math.Vector2(-TILESIZE * 0.3, TILESIZE * 0.3), // lato sinistro
         ];

         this.shadow.clear();
         this.shadow.fillStyle(0x000000, 0.5);
         this.shadow.beginPath();
         this.shadow.moveTo(points[0].x, points[0].y);
         for (let i = 1; i < points.length; i++) {
            this.shadow.lineTo(points[i].x, points[i].y);
         }
         this.shadow.closePath();
         this.shadow.fillPath();
         this.shadow.x = this.x;
         this.shadow.y = this.y;
         this.shadow.depth = 4;
      }
   }

   setShadow() {
      if (this.shadow) {
         this.shadow.clear();
         this.shadow.fillStyle(0x000000, 0.5); // Colore nero con trasparenza
         this.shadow.fillEllipse(0, 0, TILESIZE * 1.4, TILESIZE * 1.4);
         this.shadow.x = this.x - 1;
         this.shadow.y = this.y + 2;
         this.shadow.depth = 4;
      }
   }

   setModel<T extends PlayerModel>(model: Partial<T>) {
      this.model = {
         ...this.model,
         ...model,
      };
   }

   /**
    * Track the arrow keys & WASD.
    */
   private createCursorKeys() {
      return this.scene.input.keyboard!.addKeys('w,a,s,d,x,up,left,down,right,space') as Cursors;
   }

   checkCursorsIf2Dgame(status: Status) {
      if (this.cursors.left.isDown || this.cursors.a.isDown) {
         this.setModel({
            status,
            facingX: -1,
            direction: Direction.LEFT,
         });
         this.body.setVelocityX(-this.model.defaultVel);
      } else if (this.cursors.right.isDown || this.cursors.d.isDown) {
         this.setModel({
            status,
            facingX: 1,
            direction: Direction.RIGHT,
         });
         this.body.setVelocityX(this.model.defaultVel);
      } else {
         let status: Status = 'idle';
         if (this.model.status === 'hit' || this.model.status === 'fire') {
            status = this.model.status;
         }
         this.setModel({
            status,
         });
         this.body.setVelocityX(0);
      }
   }

   checkCursorsIfTopDownGame(status: Status) {
      if (this.cursors.left.isDown || this.cursors.a.isDown) {
         this.setModel({
            status,
            facingX: -1,
            direction: Direction.LEFT,
         });
         this.body.setVelocityX(-this.model.defaultVel);
      } else if (this.cursors.right.isDown || this.cursors.d.isDown) {
         this.setModel({
            status,
            facingX: 1,
            direction: Direction.RIGHT,
         });
         this.body.setVelocityX(this.model.defaultVel);
      } else if (this.cursors.up.isDown || this.cursors.w.isDown) {
         this.setModel({
            status,
            facingY: -1,
            direction: Direction.UP,
         });
         this.body.setVelocityY(-this.model.defaultVel);
      } else if (this.cursors.down.isDown || this.cursors.s.isDown) {
         this.setModel({
            status,
            facingY: 1,
            direction: Direction.DOWN,
         });
         this.body.setVelocityY(this.model.defaultVel);
      } else {
         let status: Status = 'idle';
         if (this.model.status === 'hit' || this.model.status === 'fire') {
            status = this.model.status;
         }
         this.setModel({
            status,
         });
         this.body.setVelocityX(0);
         this.body.setVelocityY(0);
      }
   }

   resetPlayerDefaultVelocity() {
      this.setModel({
         defaultVel: ORIGIN_PLAYER_VEL,
      });
   }

   setPlayerVelocityByLevelPenalties() {
      switch (this.model.penalty) {
         case 'hasSlowPenalty':
            this.setModel({
               defaultVel: 80,
            });
            break;

         case 'hasExtremeSlowPenalty':
            this.setModel({
               defaultVel: 40,
            });
            break;

         case 'none':
            this.resetPlayerDefaultVelocity();
            break;
      }
   }

   getPlayerStatus() {
      let status: Status = 'run';
      switch (this.model.status) {
         case 'hit':
            status = 'hit';
            break;
         case 'fire':
            status = 'fire';
            break;
      }
      return status;
   }

   checkPlayerHasBeenHit(time: number) {
      if (this.model.status === 'hit') {
         if (time > this.model.hitTimer) {
            this.decreaseHpStatus();
            this.setModel({
               hitTimer: this.model.updateTime + this.model.hitDelay,
            });
         } else {
            this.setModel({
               status: 'run',
            });
         }
      }
   }

   checkPlayerFire(time: number) {
      this.setModel({
         canShoot: false,
      });
      if (this.model.hasWeapon) {
         if (this.scene.input.activePointer.isDown) {
            if (time > this.model.shootTimer) {
               this.setModel({
                  status: 'fire',
                  canShoot: true,
                  shootTimer: this.model.updateTime + this.model.shootDelay,
               });
            }
         }
      }
   }

   checkPlayerJump(_time: number) {
      if ((this.cursors.up.isDown || this.cursors.w.isDown) && this.body.blocked.down) {
         this.setModel({
            status: 'jump',
            direction: Direction.UP,
         });
         this.body.setVelocityY(-200);
      }
   }

   checkPlayerSpeedByTileProperty(properties: any) {
      if (properties && properties.speed && this.model.status !== 'dead') {
         this.setModel({
            defaultVel: properties.speed,
         });
      } else if (this.model.defaultVel < ORIGIN_PLAYER_VEL) {
         this.setModel({
            defaultVel: ORIGIN_PLAYER_VEL,
         });
      }
   }

   checkCursorsByCurrentGameType(time: number, status: Status) {
      if (currentGameType === '2D') {
         this.body.setVelocityX(0);
         this.checkCursorsIf2Dgame(status);
      } else if (currentGameType === 'TopDown') {
         this.body.setVelocity(0);
         this.checkCursorsIfTopDownGame(status);
      }

      if (currentGameType === '2D') {
         this.checkPlayerJump(time);
      }
   }

   checkHandleDash(time: number) {
      if (this.cursors.x.isDown) {
         if (time - this.model.lastDashTime < this.model.dashCooldown) return;

         const dashDistance = TILESIZE;
         let dx = 0,
            dy = 0;

         switch (this.model.direction) {
            case Direction.LEFT:
               dx = -dashDistance;
               break;
            case Direction.RIGHT:
               dx = dashDistance;
               break;
            case Direction.UP:
               dy = -dashDistance;
               break;
            case Direction.DOWN:
               dy = dashDistance;
               break;
            default:
               return; // no dash if no direction
         }

         const targetX = this.x + dx;
         const targetY = this.y + dy;
         const tile = this.#gameService.tileMap?.getTileAtWorldXY(targetX, targetY, true);

         if (tile && tile.collides) {
            return; // Ostacolo presente, non dashare
         }

         this.model.lastDashTime = time;

         // Effetto afterimage/scia
         this.showDashTrail();

         // Esegui tween fluido
         this.scene.tweens.add({
            targets: this,
            x: targetX,
            y: targetY,
            duration: 100,
            ease: 'Sine.easeOut',
            onUpdate: () => {
               this.body.position.x = this.x - this.displayOriginX;
               this.body.position.y = this.y - this.displayOriginY;
            },
         });
      }
   }

   showDashTrail() {
      const trail = this.scene.add.sprite(this.x, this.y, this.texture.key);
      trail.setDepth(this.depth - 1);
      trail.setAlpha(0.4);
      trail.setScale(this.scale);
      trail.flipX = this.flipX;

      this.scene.tweens.add({
         targets: trail,
         alpha: 0,
         duration: 300,
         onComplete: () => trail.destroy(),
      });
   }

   updateShadow() {
      const offset = 10;
      let dx = 0;
      let dy = 0;
      let rotation = 0;
      if (this.model.enablePointerShadow) {
         switch (this.model.direction) {
            case 'UP':
               dy = -offset;
               break;
            case 'DOWN':
               dy = offset;
               rotation = Phaser.Math.DegToRad(180);
               break;
            case 'LEFT':
               dx = -offset;
               rotation = Phaser.Math.DegToRad(-90);
               break;
            case 'RIGHT':
               dx = offset;
               rotation = Phaser.Math.DegToRad(90);
               break;
         }
      }
      if (this.shadow) {
         this.shadow.x = this.x + dx;
         this.shadow.y = this.y + dy;
         this.shadow.setRotation(rotation);
         const scale = 1 + 0.05 * Math.sin(this.model.updateTime / 100);
         const pulse = 1 + 0.05 * Math.sin(this.model.updateTime / 100);
         this.shadow.setScale(pulse, pulse);
      }
   }

   /**
    *
    * @param {*} time
    * @param {*} tileProperties
    */
   override update(time: number, tileProperties?: any): void {
      this.model.updateTime = time;
      if (this.model.status !== 'dead') {
         this.checkPlayerSpeedByTileProperty(tileProperties);
         const status: Status = this.getPlayerStatus();
         this.setPlayerVelocityByLevelPenalties();

         this.checkCursorsByCurrentGameType(time, status);

         this.checkPlayerFire(time);
         this.checkPlayerHasBeenHit(time);

         if (this.shadow) {
            this.updateShadow();
         }

         if (currentGameType === 'TopDown') {
            // Normalize and scale the velocity so that player can't move faster along a diagonal
            this.body.velocity.normalize().scale(this.model.defaultVel);
         }

         this.flipX = this.model.facingX === -1;
         if (this.model.enableDash) {
            this.checkHandleDash(time);
         }
      }
   }

   decreaseHpStatus(amount: number = 1) {
      const numberOfPointsToDecrease = amount;
      let isDead = false;
      this.setModel({
         lives: this.model.lives - numberOfPointsToDecrease,
      });
      if (this.model.lives === 0) {
         isDead = true;
      }
      if (isDead) {
         this.setModel({
            status: 'dead',
         });
      }
   }

   destroy(fromScene?: boolean): void {
      if (this.onEnemyDead) {
         EventBus.off('enemy-dead', this.onEnemyDead);
      }
      if (this.shadow) {
         this.shadow.destroy();
         this.shadow = null;
      }
      if (this.emitter) {
         this.emitter.destroy();
         this.emitter = null;
      }
      super.destroy(fromScene);
   }

   removeFromGame(): void {
      this.destroy();
   }
}
