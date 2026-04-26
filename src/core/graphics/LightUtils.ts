import Phaser from 'phaser';
import { Direction } from '../../models/Entity';

type LightConeOptions = {
   scene: Phaser.Scene;
   origin: Phaser.Math.Vector2;
   directionRad: number; // direzione in radianti (0 = dx, PI/2 = su)
   coneAngleRad?: number; // angolo del cono, es. 60° = Math.PI/3
   lightCount?: number; // quante luci usare per simulare il cono
   maxRadius?: number; // raggio massimo delle luci
   intensity?: number; // intensità luce (0-1)
   color?: number; // colore luce, es 0xffffcc
};

export function createLightCone(opts: LightConeOptions): Phaser.GameObjects.Light[] {
   const { scene, origin, directionRad, coneAngleRad = Math.PI / 3, lightCount = 5, maxRadius = 150, intensity = 1, color = 0xffffcc } = opts;

   const lights: Phaser.GameObjects.Light[] = [];

   // Divide il cono in più luci, con angoli distribuiti simmetricamente
   for (let i = 0; i < lightCount; i++) {
      const t = lightCount === 1 ? 0.5 : i / (lightCount - 1); // da 0 a 1
      const angle = directionRad - coneAngleRad / 2 + t * coneAngleRad;

      // Posizione della luce spostata leggermente lungo la direzione del fascio
      const distanceFromOrigin = maxRadius * 0.3; // 30% del raggio verso l'esterno
      const x = origin.x + Math.cos(angle) * distanceFromOrigin;
      const y = origin.y + Math.sin(angle) * distanceFromOrigin;

      // Raggio delle luci più piccole per simulare il cono
      const radius = maxRadius * (0.7 + 0.3 * (1 - Math.abs(t - 0.5) * 2)); // più grandi al centro

      const light = scene.lights.addLight(x, y, radius, color, intensity);
      lights.push(light);
   }

   return lights;
}

export interface LightConeConfig {
   origin: Phaser.Math.Vector2;
   direction: Direction;
   length: number;
   rays: number;
   tilemapLayer: Phaser.Tilemaps.TilemapLayer;
}

export function getDirectionAngle(direction: Direction): number {
   switch (direction) {
      case 'UP':
         return Phaser.Math.DegToRad(-90);
      case 'DOWN':
         return Phaser.Math.DegToRad(90);
      case 'LEFT':
         return Phaser.Math.DegToRad(180);
      case 'RIGHT':
         return Phaser.Math.DegToRad(0);
      default:
         return Phaser.Math.DegToRad(0);
   }
}

export function castCone(config: LightConeConfig): Phaser.Math.Vector2[] {
   const { origin, direction, length, rays, tilemapLayer } = config;
   const angle = getDirectionAngle(direction);
   const spread = Phaser.Math.DegToRad(60);
   const step = spread / rays;
   const results: Phaser.Math.Vector2[] = [];

   for (let i = -spread / 2; i <= spread / 2; i += step) {
      const rayAngle = angle + i;

      const endX = origin.x + Math.cos(rayAngle) * length;
      const endY = origin.y + Math.sin(rayAngle) * length;

      const startTile = tilemapLayer.worldToTileXY(origin.x, origin.y);
      const endTile = tilemapLayer.worldToTileXY(endX, endY);

      const points = getBresenhamLine(startTile.x, startTile.y, endTile.x, endTile.y);

      let hit = false;
      for (const p of points) {
         const tile = tilemapLayer.hasTileAt(p.x, p.y) ? tilemapLayer.getTileAt(p.x, p.y) : null;

         if (tile?.collides) {
            results.push(new Phaser.Math.Vector2(tile.getCenterX(), tile.getCenterY()));
            hit = true;
            break;
         }
      }

      if (!hit) {
         results.push(new Phaser.Math.Vector2(endX, endY));
      }
   }

   return results;
}

function getBresenhamLine(x0: number, y0: number, x1: number, y1: number): { x: number; y: number }[] {
   const points: { x: number; y: number }[] = [];

   const dx = Math.abs(x1 - x0);
   const dy = Math.abs(y1 - y0);
   const sx = x0 < x1 ? 1 : -1;
   const sy = y0 < y1 ? 1 : -1;
   let err = dx - dy;

   while (true) {
      points.push({ x: x0, y: y0 });

      if (x0 === x1 && y0 === y1) break;

      const e2 = 2 * err;
      if (e2 > -dy) {
         err -= dy;
         x0 += sx;
      }
      if (e2 < dx) {
         err += dx;
         y0 += sy;
      }
   }

   return points;
}

export function drawCone(
   graphics: Phaser.GameObjects.Graphics,
   origin: Phaser.Math.Vector2,
   points: Phaser.Math.Vector2[],
   color: number = 0xffffaa,
   alpha: number = 0.3
) {
   graphics.clear();
   graphics.fillStyle(color, alpha);
   graphics.beginPath();
   graphics.moveTo(origin.x, origin.y);
   for (const p of points) {
      graphics.lineTo(p.x, p.y);
   }
   graphics.closePath();
   graphics.fillPath();
}

export function isPointInCone(origin: Phaser.Math.Vector2, points: Phaser.Math.Vector2[], target: Phaser.Math.Vector2): boolean {
   const polygon = new Phaser.Geom.Polygon([origin, ...points]);
   return Phaser.Geom.Polygon.Contains(polygon, target.x, target.y);
}

export function getConeColor(targetX: number, targetY: number, origin: Phaser.Math.Vector2, points: Phaser.Math.Vector2[]): number {
   const inCone = isPointInCone(origin, points, new Phaser.Math.Vector2(targetX, targetY));
   return inCone ? 0xff0000 : 0xffffaa; // rosso se colpito, altrimenti giallo
}
