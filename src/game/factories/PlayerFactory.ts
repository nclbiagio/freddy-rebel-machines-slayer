import { Tilemaps } from 'phaser';
import { GameSceneTypes, GameService } from '../../GameService';
import { setPositionBasedOnExitRooms } from '../../core/utils/MapUtils';
import { PlayerSprite } from '../../sprites/Player';
import { Direction } from '../../models/Entity';
import { LevelStore, PlayerLevelStore } from '../state/LevelStore';
import { PlayerStateService } from '../state/PlayerState';
import { PlayerState } from '../../models/EquipmentAndStats';

const getRightPlayerPosition = (
   playerObject: Phaser.Types.Tilemaps.TiledObject | null | undefined,
   exitRoomObjectLayer: Tilemaps.ObjectLayer | null | undefined,
   tiledWidth: number,
   tiledHeight: number
) => {
   const gameService = GameService.getInstance();
   const levelStore = LevelStore.getInstance();
   const store = levelStore.dataLevel$.getValue();
   const prevRoom = gameService.prevScene$.getValue();
   let playerPosition = {
      x: playerObject?.x || 256,
      y: playerObject?.y || 360,
   };
   let playerLevelStore: PlayerLevelStore | null | undefined = null;

   //This logic applies only to Rooms
   if (prevRoom && prevRoom.includes('Room')) {
      if (store) {
         playerLevelStore = store[prevRoom]?.player;
      }
      if (exitRoomObjectLayer) {
         const exitRoomToPrevLevel = exitRoomObjectLayer.objects.find((exit) => exit.name === prevRoom);
         if (exitRoomToPrevLevel) {
            playerPosition = setPositionBasedOnExitRooms(exitRoomToPrevLevel, tiledWidth, tiledHeight);
         }
      }
   }

   return { playerPosition, playerLevelStore };
};

export const loadPlayerFromStore = (scene: GameSceneTypes): PlayerState | null => {
   const levelStore = LevelStore.getInstance();
   const storedData = levelStore.dataLevel[scene]?.player;

   if (storedData && storedData.stats) {
      return {
         name: '',
         stats: storedData.stats,
         equippedItems: storedData.equippedItems,
         usableItems: storedData.inventory || [],
         spells: storedData.spells || [],
         money: storedData.money || 0,
      };
   }
   return null;
};

export const savePlayerToStore = (scene: GameSceneTypes, state: PlayerState) => {
   const levelStore = LevelStore.getInstance();

   levelStore.setLevelStore(scene, {
      player: {
         x: 0,
         y: 0,
         lives: state.stats.health / 10,
         direction: Direction.DOWN,
         stats: state.stats,
         equippedItems: state.equippedItems,
         inventory: state.usableItems,
         spells: state.spells,
         money: state.money,
      },
   });
};

export const createPlayer = <T extends PlayerSprite>(
   scene: Phaser.Scene,
   creator: (scene: Phaser.Scene, props: any, model?: any) => T,
   playerObject: Phaser.Types.Tilemaps.TiledObject | null | undefined,
   exitRoomObjectLayer: Tilemaps.ObjectLayer | null | undefined,
   tiledWidth: number,
   tiledHeight: number,
   modelOverrides?: any
): T => {
   const playerService = PlayerStateService.getInstance();

   const { playerPosition, playerLevelStore } = getRightPlayerPosition(playerObject, exitRoomObjectLayer, tiledWidth, tiledHeight);

   // Try to load full state from store (Inventory, Stats, etc)
   const gameScene = GameService.getInstance().scene$.getValue();
   if (gameScene) {
      const persistedState = loadPlayerFromStore(gameScene);
      if (persistedState) {
         playerService.hydrate(persistedState);
      }
   }

   const player = creator(
      scene,
      {
         x: playerPosition.x,
         y: playerPosition.y,
      },
      {
         hasWeapon: true,
         lives: playerService.state.stats.health / 10,
         direction: playerLevelStore?.direction || Direction.RIGHT,
         shootDelay: 500,
         enableShadow: true,
         enableExperienceEncrease: true,
         ...modelOverrides,
      }
   );

   if (player) {
      playerService.updateStats({
         health: player.model.lives * 10,
      });
   }
   return player;
};
