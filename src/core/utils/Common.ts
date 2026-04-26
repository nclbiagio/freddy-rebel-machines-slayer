import { GameObjects } from 'phaser';
import { GameService, TILESIZE } from '../../GameService';
import { Direction } from '../../models/Entity';

export const getOppositeDirection = (direction: Direction) => {
   if (direction === Direction.LEFT) {
      return Direction.RIGHT;
   } else if (direction === Direction.RIGHT) {
      return Direction.LEFT;
   } else if (direction === Direction.UP) {
      return Direction.DOWN;
   } else if (direction === Direction.DOWN) {
      return Direction.UP;
   } else {
      return Direction.NONE;
   }
};

export const canDoActionAfterDelay = (time: number, lastActionAt: number, delay: number) => {
   if (time - lastActionAt < delay) {
      return false;
   } else {
      return true;
   }
};

export const shuffle = <T>(array: T[]) => {
   for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
   }
   return array;
};

export const getCanvasWidth = (currentValue: string) => {
   const canvasElementWidth = document.querySelector<HTMLCanvasElement>('#game canvas')?.offsetWidth;
   if (canvasElementWidth) {
      return `width: ${canvasElementWidth - 20}px`;
   }
   return currentValue;
};

export function directionToRadians(direction: Direction): number {
   switch (direction) {
      case 'RIGHT':
         return 0;
      case 'DOWN':
         return Math.PI / 2;
      case 'LEFT':
         return Math.PI;
      case 'UP':
         return (3 * Math.PI) / 2;
      default:
         return 0;
   }
}

/**
 * Restituisce un intero casuale compreso fra min e max, inclusi.
 * Esempio: roll(1, 6) simula un d6.
 */
export function roll(min: number, max: number): number {
   return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const getObjectBounds = (sprite: GameObjects.Sprite) => {
   const canvasRect = GameService.getInstance().game?.canvas.getBoundingClientRect();
   const bounds = sprite.getBounds();
   if (canvasRect && bounds) {
      const x = canvasRect.left + bounds.x;
      const y = canvasRect.top + bounds.y;
      return {
         x,
         y,
      };
   } else {
      return {
         x: 0,
         y: 0,
      };
   }
};
