import { FreddyEntity } from '../../entities/FreddyEntity';
import { GameService } from '../../GameService';
import { Direction } from '../../models/Entity';
import { PlayerSprite } from '../../sprites/Player';

export type BaseCollisionServiceCallbacksType =
   | 'getSceneData'
   | 'changeRoom'
   | 'openMessage'
   | 'openChest'
   | 'updatePlayerState'
   | 'showWarning'
   | 'updateDoorState'
   | 'showDamage';

export interface BaseCollisionEntities {
   player: PlayerSprite | FreddyEntity;
   groundLayer: Phaser.Tilemaps.TilemapLayer;
}

export abstract class BaseCollisionService<T extends BaseCollisionEntities, K extends string = BaseCollisionServiceCallbacksType> {
   protected gameService = GameService.getInstance();
   protected callbackList: { [key in K]?: (...args: any) => void } = {} as any;
   protected scene: Phaser.Scene;
   protected entities: T;
   protected isSceneChanging: boolean = false;

   constructor(scene: Phaser.Scene, entities: T) {
      this.scene = scene;
      this.entities = entities;
   }

   public init(): void {
      this.addBaseColliders();
      this.addSceneColliders();
   }

   public addCallback(key: K, callback: (...args: any) => void) {
      if (!this.callbackList[key]) {
         this.callbackList[key] = callback;
         console.log(`${key} added to callback list`);
      }
   }

   protected addBaseColliders(): void {
      const { player, groundLayer } = this.entities;
      if (groundLayer && player) {
         this.scene.physics.world.bounds.setTo(0, 0, groundLayer.width, groundLayer.height);
         this.scene.physics.world.setBoundsCollision(true, true, true, true);
      }
      if (player) {
         this.scene.physics.add.collider(player, groundLayer);
      }
   }

   protected abstract addSceneColliders(): void;
}
