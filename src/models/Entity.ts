export interface EntityModel {
   x: number;
   y: number;
   key: string | Phaser.Textures.Texture;
   id: string;
}

export enum Direction {
   UP = 'UP',
   DOWN = 'DOWN',
   LEFT = 'LEFT',
   RIGHT = 'RIGHT',
   NONE = 'NONE',
}
