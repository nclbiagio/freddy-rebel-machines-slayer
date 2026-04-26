import { Tilemaps } from 'phaser';
import EasyStar from 'easystarjs';
import { Direction } from '../../models/Entity';
import { GameService, TILESIZE } from '../../GameService';
export class PathFinder {
   private _path!: { x: number; y: number }[] | null;
   finder = new EasyStar.js();
   map!: Tilemaps.Tilemap;
   constructor(map: Tilemaps.Tilemap) {
      this.map = map;
      this.setGridFinder();
      this.setAcceptableTilesFinder();
      this.inflateObstacles(1);
   }

   //TODO right now followPathPoints are created randomly, implements throught pointsIdTofollow the ability to set it
   static getFollowPathPointsFromTiled(followPathObjectLayer: Tilemaps.ObjectLayer, pathId?: string) {
      if (followPathObjectLayer) {
         let followPathPoints = followPathObjectLayer.objects.map((point) => ({
            id: `${point.name}`, //Using name to order points
            x: point.x || 0,
            y: point.y || 0,
            pathId: point.properties?.find((p: any) => p.name === 'pathId')?.value,
         }));

         if (pathId) {
            followPathPoints = followPathPoints.filter((point) => point.pathId === pathId);
         }

         if (followPathPoints && followPathPoints.length > 0) {
            // Sort points by name/id to ensure deterministic path following
            return followPathPoints.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' }));
         }
         return [];
      }
      return [];
   }

   setGridFinder() {
      const grid = [];
      for (let y = 0; y < this.map.height; y++) {
         const col = [];
         for (let x = 0; x < this.map.width; x++) {
            // In each cell we store the ID of the tile, which corresponds
            // to its index in the tileset of the map ("ID" field in Tiled)
            const tileIndex = this.getTileID(x, y);
            if (tileIndex) {
               col.push(tileIndex);
            }
         }
         grid.push(col);
      }
      this.finder.setGrid(grid);
   }

   getTileID(x: number, y: number) {
      const tile = this.map.getTileAt(x, y);
      if (tile) {
         return tile.index;
      }
      return null;
   }

   setAcceptableTilesFinder() {
      const tileset = this.map.tilesets.filter((set) => set.name === 'ground')[0];
      const properties: any = tileset.tileProperties;
      const acceptableTiles: number | number[] = [];

      //const trees = this.map.tilesets.filter((set) => set.name === 'trees');

      // We need to list all the tile IDs that can be walked on. Let's iterate over all of them
      // and see what properties have been entered in Tiled.
      for (let i = tileset.firstgid - 1; i < tileset.total; i++) {
         // firstgid and total are fields from Tiled that indicate the range of IDs that the tiles can take in that tileset
         if (!properties.hasOwnProperty(i)) {
            // If there is no property indicated at all, it means it's a walkable tile
            acceptableTiles.push(i + 1);
            continue;
         }
         if (!properties[i].collides) {
            acceptableTiles.push(i + 1);
         }
         if (properties[i].cost) {
            this.finder.setTileCost(i + 1, properties[i].cost);
         }
         //if (!properties[i].collides) acceptableTiles.push(i + 1);
         //if (properties[i].cost) Game.finder.setTileCost(i + 1, properties[i].cost); // If there is a cost attached to the tile, let's register it
      }
      this.finder.setAcceptableTiles(acceptableTiles);
   }

   inflateObstacles(bufferSize = 1) {
      const inflated = new Set<string>();

      const addInflatedTile = (x: number, y: number) => {
         if (x >= 0 && x < this.map.width && y >= 0 && y < this.map.height) {
            inflated.add(`${x},${y}`);
         }
      };

      for (let y = 0; y < this.map.height; y++) {
         for (let x = 0; x < this.map.width; x++) {
            const tile = this.map.getTileAt(x, y);
            if (tile && tile.properties.collides) {
               for (let dy = -bufferSize; dy <= bufferSize; dy++) {
                  for (let dx = -bufferSize; dx <= bufferSize; dx++) {
                     if (dx !== 0 || dy !== 0) {
                        addInflatedTile(x + dx, y + dy);
                     }
                  }
               }
            }
         }
      }

      inflated.forEach((key) => {
         const [ix, iy] = key.split(',').map(Number);
         const tile = this.map.getTileAt(ix, iy);
         if (tile) {
            // Evita che EasyStar preferisca passare vicino ai bordi
            this.finder.setAdditionalPointCost(ix, iy, 9999);
         }
      });
   }

   setPath(path: { x: number; y: number }[]) {
      this._path = path;
   }

   clearPath() {
      this._path = null;
   }

   getPath() {
      return this._path;
   }

   calculatePath(fromX: number, fromY: number, toX: number, toY: number, onPathCalculated: (path: { x: number; y: number }[] | null) => void) {
      if (!this.map) return;
      this.finder.findPath(fromX, fromY, toX, toY, (path) => {
         this.setPath(path);
         if (onPathCalculated) {
            onPathCalculated(path);
         }
      });
      this.finder.calculate();
   }

   determineDirectionFromTarget(x: number, y: number, targetX: number, targetY: number, directions: Direction[]) {
      let closestDirection = Direction.NONE;
      let closestDistance = -1;

      for (const dir of directions) {
         const position = this.positionInDirection(x, y, dir);

         /* if (layer.getTileAtWorldXY(position.x, position.y)) {
          // cannot move into walls
          continue;
       } */

         const d = Phaser.Math.Distance.Between(position.x, position.y, targetX, targetY);
         if (closestDirection === Direction.NONE) {
            // first possible direction
            closestDirection = dir;
            closestDistance = d;
            continue;
         }

         if (d < closestDistance) {
            closestDirection = dir;
            closestDistance = d;
         }
      }

      return closestDirection;
   }

   positionInDirection(x: number, y: number, direction: Direction) {
      switch (direction) {
         case Direction.UP:
            return { x, y: y - TILESIZE };

         case Direction.LEFT:
            return { x: x - TILESIZE, y };

         case Direction.DOWN:
            return { x, y: y + TILESIZE };

         case Direction.RIGHT:
            return { x: x + TILESIZE, y };

         default:
            return { x, y };
      }
   }
}
