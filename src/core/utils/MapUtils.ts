import { TILESIZE } from '../../GameService';

/**
 * Calculates the spawn position based on the exit room from the previous level.
 * This is primarily used for "Room" based scene transitions.
 * @param exitRoomToPrevLevel The exit object pointing to the previous level/room.
 * @param canvasWidth The width of the game canvas.
 * @param canvasHeight The height of the game canvas.
 * @returns An object containing the x and y coordinates.
 */
export const setPositionBasedOnExitRooms = (exitRoomToPrevLevel: Phaser.Types.Tilemaps.TiledObject, canvasWidth: number, canvasHeight: number) => {
   let offsetX = exitRoomToPrevLevel.x || TILESIZE;
   let offsetY = exitRoomToPrevLevel.y || TILESIZE;
   const smallOffset = 12;
   if (exitRoomToPrevLevel && exitRoomToPrevLevel.x !== undefined && exitRoomToPrevLevel.y !== undefined) {
      if (Math.round(exitRoomToPrevLevel.x) === 0) {
         offsetX = Math.round(exitRoomToPrevLevel.x) + TILESIZE + smallOffset;
      }
      if (Math.round(exitRoomToPrevLevel.x) === canvasWidth) {
         offsetX = Math.round(exitRoomToPrevLevel.x) - TILESIZE - smallOffset;
      }
      if (Math.round(exitRoomToPrevLevel.y) === 0) {
         offsetY = Math.round(exitRoomToPrevLevel.y) + TILESIZE + smallOffset;
      }
      if (Math.round(exitRoomToPrevLevel.y) === canvasHeight) {
         offsetY = Math.round(exitRoomToPrevLevel.y) - TILESIZE - smallOffset;
      }
   }
   return {
      x: offsetX,
      y: offsetY,
   };
};

/**
 * Helper to get a property value from a Tiled object safely.
 * @param tiledObject The Tiled object.
 * @param propName The name of the property to retrieve.
 * @param defaultType Optional default value if not found.
 * @returns The value of the property or the default value.
 */
export const getObjectPropValueFromTiled = (tiledObject: Phaser.Types.Tilemaps.TiledObject, propName: string, defaultType: any = '') => {
   if (tiledObject.properties && tiledObject.properties.length > 0) {
      const type = tiledObject.properties.find((prop: { name: string; type: any; value: any }) => prop.name === propName);
      if (type) {
         return type.value;
      }
   }
   return defaultType;
};
