import { Scene } from 'phaser';
import { GameService } from '../../GameService';
import { EventBus } from '../../EventBus';
import { FreddyEntity } from '../../entities/FreddyEntity';
import { MagnetGunEntity } from '../../entities/MagnetGunEntity';
import { CableEntity } from '../../entities/CableEntity';
import { MachineEntity } from '../../entities/MachineEntity';
import { MagnetProjectile } from '../../entities/MagnetProjectile';
import { CarEntity } from '../../entities/CarEntity';
import { MainframeEntity } from '../../entities/MainframeEntity';
import { CarLift } from '../../entities/CarLift';
import { BouncyGoo } from '../../entities/BouncyGoo';
import { ExcavatorEntity } from '../../entities/ExcavatorEntity';
import { WashingMachineEntity } from '../../entities/WashingMachineEntity';

export class LoadAssetsScene extends Scene {
   #gameService = GameService.getInstance();

   constructor() {
      super({
         key: 'LoadAssets',
      });
   }

   init() {
      this.#gameService.scene$.next('LoadAssets');
      EventBus.on('load-assets-complete', () => {
         this.#gameService.nextSceneFromTimeline('LoadAssets', this);
      });
   }

   preload() {
      this.load.setPath(this.#gameService.assetsPath);
      const loadedAssets: string[] = [];
      //Loading Assets Progress Bar
      this.load.on('progress', (items: number) => {
         const status = items * 100;
         this.#gameService.loadProgress$.next(Math.round(status));
         //console.info('Items Loading Progress: ', status);
         if (status === 100) {
            console.log(`Assets loaded: ${status}%`);
            console.info('Loaded asset: ', loadedAssets);
         }
      });
      this.load.on('fileprogress', (file: { key: string }) => {
         //console.info('Loading asset: ', file.key);
         loadedAssets.push(file.key);
      });

      this.load.audio('intro', ['music/intro.mp3']);
      this.load.audio('menu-theme', ['music/menu.mp3']);
      this.load.audio('levelSelect', ['music/levelSelect.mp3']);
      this.load.audio('level0', ['music/Level0.mp3']);
      this.load.audio('level1', ['music/Level1.mp3']);
      this.load.audio('level2', ['music/level2.mp3']);
      this.load.audio('level3', ['music/Level3.mp3']);
      this.load.audio('ending', ['music/ending.mp3']);
      this.load.audio('game-base-soundtrack', ['music/game-base-soundtrack.mp3']);
      this.load.audio('gameOver', ['music/gameOver.mp3']);
      this.load.audio('cinematic', ['music/cinematic.mp3']);

      this.load.image('ground', 'tilemaps/ground.png');
      this.load.image('bg_garage_far', 'spritesheet/bg_garage_far.png');
      this.load.image('bg_garage_mid', 'spritesheet/bg_garage_mid.png');
      this.load.image('bg_garage_near', 'spritesheet/bg_garage_near.png');

      // Tile e Prop del Livello 0 (Laundry)
      this.load.image('bg_laundry_far', 'spritesheet/lv0/bg_laundry_far.png');
      this.load.image('bg_laundry_mid', 'spritesheet/lv0/bg_laundry_mid.png');
      this.load.image('bg_laundry_near', 'spritesheet/lv0/bg_laundry_near.png');
      this.load.image('ground_laundry', 'tilemaps/lv0/ground.png');

      // Tile e Prop del Livello 2
      this.load.image('ground_chemical', 'tilemaps/lv2/ground.png');
      this.load.image('bg_chemical_far', 'spritesheet/lv2/bg_chemical_far.png');
      this.load.image('bg_chemical_mid', 'spritesheet/lv2/bg_chemical_mid.png');
      this.load.image('bg_chemical_near', 'spritesheet/lv2/bg_chemical_near.png');
      this.load.image('tile_acid_animated', 'spritesheet/lv2/tile_acid_animated.png');

      // Tile e Prop del Livello 3
      this.load.image('ground_mine', 'tilemaps/lv3/ground.png');
      this.load.image('bg_mine_sky', 'spritesheet/lv3/bg_mine_sky.png');
      this.load.image('bg_mine_clouds', 'spritesheet/lv3/bg_mine_clouds.png');
      this.load.image('bg_mine_far', 'spritesheet/lv3/bg_mine_far.png');
      this.load.image('bg_mine_mid', 'spritesheet/lv3/bg_mine_mid.png');
      this.load.image('bg_mine_near', 'spritesheet/lv3/bg_mine_near.png');
      this.load.image('tile_mine_hazard', 'spritesheet/lv3/tile_mine_hazard.png');

      ///////////////
      MagnetGunEntity.loadSpritesheet(this);
      FreddyEntity.loadSpritesheet(this);
      CableEntity.loadSpritesheet(this);
      MachineEntity.loadSpritesheet(this);
      MagnetProjectile.loadSpritesheet(this);
      CarEntity.loadSpritesheet(this);
      MainframeEntity.loadSpritesheet(this);
      CarLift.loadSpritesheet(this);
      BouncyGoo.loadSpritesheet(this);
      ExcavatorEntity.loadAssets(this);
      WashingMachineEntity.loadSpritesheet(this);
      /**
       * Here Extends assets
       */
      this.load.tilemapTiledJSON('Level1', 'tilemaps/level1.json');
      this.load.tilemapTiledJSON('Level2', 'tilemaps/lv2/level2.json');
      this.load.tilemapTiledJSON('Level0', 'tilemaps/lv0/level0.json');
      this.load.tilemapTiledJSON('Level3', 'tilemaps/lv3/level3.json');
   }
}
