import { Scene, Tilemaps } from 'phaser';
import { ObjectLayers, SceneData, TileLayers } from '../../models/Game';
import { GameSceneTypes, GameService, TILESIZE } from '../../GameService';
import { MessageUtils } from '../../message/Message';
import { DebugUtils } from '../../debug/Debug';
import { Data, LevelStore } from '../../game/state/LevelStore';
import { ExplosionService } from '../../core/graphics/Explosion';
import { PlayerStateService } from '../../game/state/PlayerState';
import { FreddyEntity } from '../../entities/FreddyEntity';
import { MagnetProjectile } from '../../entities/MagnetProjectile';
import { EventBus } from '../../EventBus';

/**
 * @description use this scene for scene related to top down and 2D games
 */

export interface CameraOptions {
   disableFadeOutFadeIn: boolean;
   fadeInFadeOutDuration: number;
}

export abstract class BaseScene<TileLayerNames extends string, ObjectLayerNames extends string> extends Scene {
   gameService = GameService.getInstance();
   messageUtils = MessageUtils.getInstance();
   debugUtils = DebugUtils.getInstance();
   levelStore = LevelStore.getInstance();
   playerService = PlayerStateService.getInstance();

   private static hasLoggedStorageStatus = false;

   explosionService: ExplosionService | null = null;
   tileMap?: Phaser.Tilemaps.Tilemap;

   tileLayers?: TileLayers<TileLayerNames>;
   objectLayers?: ObjectLayers<ObjectLayerNames>;

   player!: FreddyEntity;

   timer: Phaser.Time.TimerEvent | null = null;
   timerCountdown = 600;

   gameHasInventory = false;
   cameraOptions: CameraOptions = {
      disableFadeOutFadeIn: false,
      fadeInFadeOutDuration: 200,
   };
   lastMouseButton: 'left' | 'right' | null = null;
   protected _lastWarningTimes: Map<string, number> = new Map();
   private parallaxLayers: { sprite: Phaser.GameObjects.TileSprite; scrollFactor: number }[] = [];

   // Tile Animations
   private animatedTiles: {
      tileset: Phaser.Tilemaps.Tileset;
      baseIndex: number; // Original GID index in tileset
      frames: { duration: number; tileid: number }[];
      accumulator: number;
      currentFrameIndex: number;
      tiles: Phaser.Tilemaps.Tile[]; // Direct references for high performance
   }[] = [];

   constructor(sceneKey: string) {
      super({
         key: sceneKey,
      });
      if (this.gameService.debug && !BaseScene.hasLoggedStorageStatus) {
         BaseScene.hasLoggedStorageStatus = true;
         let message = '';
         if (this.levelStore.isSessionStorageEnabled) {
            message = 'Session storage ENABLED';
         } else {
            message = 'Session storage NOT enabled';
         }
         this.messageUtils.addFlyMessage({ key: 'utils_sessionStorageIsActiveOrNot', text: `${message}` });
      }
   }

   init(): void {
      this.onBaseSceneInit();
      this.onInit(); // <-- Hook for this class childs
      const currentSceneKey = this.gameService.scene$.getValue() as GameSceneTypes;
      this.levelStore.setLevelStore(currentSceneKey);
      this.explosionService = ExplosionService.getInstance(this, currentSceneKey);
   }

   protected onBaseSceneInit(): void {
      // Logica condivisa da tutte le scene
      console.log('[BaseScene] initBase logic');
      this.physics.world.fixedStep = false;
      this.events.on('resume', this.handleResumeScene, this);
      this.input.mouse?.disableContextMenu();
      this.input.on('pointerdown', (pointer: { button: number }) => {
         if (pointer.button === 0) {
            this.lastMouseButton = 'left';
         } else if (pointer.button === 2) {
            this.lastMouseButton = 'right';
         }
      });
      this.input.on('pointerup', () => {
         this.lastMouseButton = null;
      });

      if (this.gameHasInventory) {
         this.input.keyboard?.on('keydown-I', () => {
            const scene = this.gameService.scene$.getValue();
            if (scene) {
               this.gameService.prevScene$.next(scene);
               this.scene.pause();
               this.scene.launch('Inventory');
            }
         });
      }

      // Listener per il riavvio del livello via EventBus (dal componente Vue)
      const onRestartLevel = () => {
         if (this.scene.isActive()) {
            console.log(`[BaseScene] Event restart-level received for: ${this.scene.key}`);
            this.scene.restart();
         }
      };

      EventBus.on('restart-level', onRestartLevel);

      // Pulizia dell'evento quando la scena viene chiusa o distrutta
      this.events.once('shutdown', () => {
         EventBus.off('restart-level', onRestartLevel);
      });

      // Inizializza il loop di animazione dei tile
      this.events.on('preupdate', (_time: number, delta: number) => {
         this.updateTileAnimations(delta);
      });
   }

   protected abstract onInit(): void;

   protected abstract onResumeHook(scene: GameSceneTypes, data?: { resumeFrom: GameSceneTypes; action?: string }): void;

   protected createTileLayers(
      mapKey: string,
      tilesetMappings: {
         [layerName: string]: { tilesetName: string; imageKey: string; collisions: boolean } | { tilesetName: string; imageKey: string; collisions: boolean }[];
      },
      layerNames: TileLayerNames[]
   ) {
      this.tileMap = this.make.tilemap({ key: mapKey });
      if (!this.tileMap) {
         console.error(`[ERROR] Game Map with key ${mapKey} not created!`);
         return null;
      }
      this.gameService.tileMap = this.tileMap;
      const layers: Partial<TileLayers<TileLayerNames>> = {};

      for (const layerName of layerNames) {
         const name = layerName as string;
         const configEntries = tilesetMappings[name];

         if (!configEntries) {
            console.warn(`[WARNING] No tileset config for layer "${name}"`);
            continue;
         }

         const configs = Array.isArray(configEntries) ? configEntries : [configEntries];
         const tilesets: Phaser.Tilemaps.Tileset[] = [];
         let anyCollisions = false;

         for (const config of configs) {
            const tileset = this.tileMap.addTilesetImage(config.tilesetName, config.imageKey);
            if (tileset) {
               tilesets.push(tileset);
               if (config.collisions) anyCollisions = true;
            } else {
               console.error(`[ERROR] Tileset "${config.tilesetName}" not found for layer "${name}"`);
            }
         }

         if (tilesets.length === 0) {
            console.error(`[ERROR] No valid tilesets found for layer "${name}"`);
            continue;
         }

         const layer = this.tileMap.createLayer(name, tilesets, 0, 0);

         if (!layer) {
            console.error(`[ERROR] Tile layer "${name}" not created!`);
            continue;
         }

         if (anyCollisions) {
            // Imposta collisioni se necessario
            layer.setCollisionByProperty({ collides: true });
            this.setAmbientLights(layer);
            if (this.gameService.debug) {
               this.debugUtils.showDebugWalls(this, layer);
            }
         }

         layers[name as TileLayerNames] = layer;
      }

      if (!layers) {
         console.error('Tile layers not properly created');
         return;
      }

      this.tileLayers = layers as TileLayers<TileLayerNames>;

      // Registra i tile animati trovati nei tileset
      this.registerAnimatedTiles();
   }

   private registerAnimatedTiles() {
      if (!this.tileMap) return;
      this.animatedTiles = [];

      this.tileMap.tilesets.forEach((tileset) => {
         const tileData = (tileset as any).tileData;
         if (!tileData) return;

         for (const id in tileData) {
            if (tileData[id].animation) {
               const animData = {
                  tileset,
                  baseIndex: parseInt(id),
                  frames: tileData[id].animation,
                  accumulator: 0,
                  currentFrameIndex: 0,
                  tiles: [] as Phaser.Tilemaps.Tile[],
               };

               // Scansione singola della mappa per trovare tutti i tile che usano questo GID
               const targetGid = tileset.firstgid + animData.baseIndex;
               this.tileMap?.layers.forEach((layerData) => {
                  const layer = layerData.tilemapLayer;
                  if (!layer) return;

                  // Troviamo i tile e aggiungiamoli alla lista
                  const foundTiles = layer.filterTiles((tile: Phaser.Tilemaps.Tile) => tile.index === targetGid);
                  animData.tiles.push(...foundTiles);
               });

               this.animatedTiles.push(animData);
            }
         }
      });
   }

   private updateTileAnimations(delta: number) {
      if (!this.tileMap || this.animatedTiles.length === 0) return;

      this.animatedTiles.forEach((anim) => {
         anim.accumulator += delta;
         const currentFrame = anim.frames[anim.currentFrameIndex];

         if (anim.accumulator >= currentFrame.duration) {
            anim.accumulator -= currentFrame.duration;
            anim.currentFrameIndex = (anim.currentFrameIndex + 1) % anim.frames.length;

            const nextTileId = anim.frames[anim.currentFrameIndex].tileid;
            const newGid = anim.tileset.firstgid + nextTileId;

            // Aggiornamento diretto dei riferimenti (ultra-veloce)
            anim.tiles.forEach((tile) => {
               tile.index = newGid;
            });
         }
      });
   }

   protected setAmbientLights(groundLayer: Tilemaps.TilemapLayer) {
      groundLayer.setPipeline('Light2D');
      this.lights.enable();
      this.lights.setAmbientColor(0xffffff); //0x0a0a2a  -> blu scuro,  0xffffff -> bianco
   }

   protected createObjectsLayers(layers: ObjectLayerNames[]) {
      if (!this.tileMap) return null;

      const objectLayers: Partial<ObjectLayers<ObjectLayerNames>> = {};

      for (const layerName of layers) {
         const name = layerName as string;
         const layer = this.tileMap.getObjectLayer(name);
         if (!layer) {
            console.error(`Layer ${name} not available! ObjectLayers not created`);
            return null;
         }
         objectLayers[name as ObjectLayerNames] = layer;
      }

      if (!objectLayers) {
         console.error('Missing layers in tilemap');
         return;
      }

      this.objectLayers = objectLayers as ObjectLayers<ObjectLayerNames>;
   }

   protected startGameOverScene() {
      if (this.timer) {
         this.timer.destroy();
         this.timer = null;
      }

      // Cinematic Game Over Effect
      this.time.timeScale = 0.5; // Slow motion
      this.cameras.main.zoomTo(2, 2000); // Zoom in over 2s (scaled by timeScale?)
      if (this.player) {
         this.cameras.main.pan(this.player.x, this.player.y, 2000); // Center on player
      }

      // Wait for effect to finish
      this.time.delayedCall(2000, () => {
         this.time.timeScale = 1; // Reset time scale
         this.scene.start('GameOver');
      });
   }

   protected createCamera(options?: CameraOptions): void {
      if (options) {
         this.cameraOptions = {
            ...this.cameraOptions,
            ...options,
         };
      }
      if (this.tileMap) {
         this.cameras.main.setBounds(0, 0, this.tileMap.widthInPixels, this.tileMap.heightInPixels);
      }
      if (this.player) {
         this.cameras.main.startFollow(this.player, true, 0.5, 0.5);
      }
      if (options && options.disableFadeOutFadeIn !== undefined) {
         this.cameraOptions.disableFadeOutFadeIn = options.disableFadeOutFadeIn;
      } else {
         this.cameras.main.fadeIn(this.cameraOptions.fadeInFadeOutDuration);
      }
   }

   protected createExplosions() {
      if (this.explosionService) {
         this.explosionService.setupFireball();
      }
   }

   protected createParallaxBackgrounds(layersConfig: { key: string; scrollFactor: number; depth: number }[]) {
      if (!this.tileMap) return;

      const mapWidth = this.tileMap.widthInPixels;
      const mapHeight = this.tileMap.heightInPixels;

      layersConfig.forEach((config) => {
         // Usiamo TileSprite per permettere il tiling infinito quando il scrollFactor è < 1
         const bg = this.add.tileSprite(0, 0, mapWidth, mapHeight, config.key);
         bg.setOrigin(0, 0);
         bg.setScrollFactor(config.scrollFactor);
         bg.setDepth(config.depth);

         // SFOCATURA SELETTIVA (Depth of Field)
         // Più è lontano (scrollFactor basso), più sfumiamo
         if (config.scrollFactor < 1) {
            const blurAmount = (1 - config.scrollFactor) * 4;
            if (blurAmount > 0) {
               // Valori ridotti per un effetto più naturale e meno "nebbia"
               bg.postFX.addBlur(1, 0.5, 0.5, blurAmount);
            }
         } else {
            // Solo gli elementi vicini (o con scrollFactor >= 1) ricevono le luci dinamiche
            bg.setPipeline('Light2D');
         }
      });
   }

   changeScene(
      currentScene: GameSceneTypes,
      nextScene: GameSceneTypes,
      action: 'pause&resume' | 'stop&start',
      sceneData?: SceneData & { [key: string]: any },
      someDataToStore?: Data
   ) {
      const actionToTriggerEvent = () => {
         if (someDataToStore) {
            this.levelStore.setLevelStore(currentScene, {
               ...someDataToStore,
            });
         }
         if (action === 'stop&start') {
            this.gameService.nextSceneFromTimeline(currentScene, this, nextScene, sceneData);
         } else {
            this.gameService.prevScene$.next(currentScene);
            this.scene.pause();
            this.scene.launch(nextScene, sceneData);
         }
      };

      if (this.cameraOptions.disableFadeOutFadeIn) {
         actionToTriggerEvent();
      } else {
         this.cameras.main.fadeOut(this.cameraOptions.fadeInFadeOutDuration, 0, 0, 0);

         // Dopo il fade out, cambiamo scena
         this.cameras.main.once('camerafadeoutcomplete', () => {
            actionToTriggerEvent();
         });
      }
   }

   protected getCommonSceneData() {
      return {
         lastMouseButton: this.lastMouseButton,
      };
   }

   protected showDebouncedMessage(key: string, text: string, cooldown: number = 3000) {
      const now = this.time.now;
      const lastTime = this._lastWarningTimes.get(key) || 0;
      if (now - lastTime > cooldown) {
         this.messageUtils.addFlyMessage({ key, text });
         this._lastWarningTimes.set(key, now);
      }
   }

   createBullets(maxNumber: number, type: string = '') {
      const bulletsGroup = this.add.group({ runChildUpdate: true });
      const bulletList = Array.from(Array(maxNumber), (_, _index) => {
         return this.createBullet(type);
      });
      bulletList.forEach((bullet) => {
         if (bullet) {
            bulletsGroup.add(bullet);
         }
      });
      return bulletsGroup;
   }

   createBullet(type: string) {
      const defPosition = {
         x: TILESIZE,
         y: TILESIZE,
      };
      const defaultVel = 200;
      switch (type) {
         case 'magnet':
            const magnetBullet = MagnetProjectile.create(this, defPosition, {
               defaultVel: 400,
               type: 'magnet',
            });
            return magnetBullet;

         default:
            console.log(`${type} bullet is missing`);
            break;
      }
   }

   exampleDayLight(time: number) {
      // Cambia ambient color per simulare il passaggio dal crepuscolo alla notte
      const dayProgress = (Math.sin(time * 0.0005) + 1) / 2; // valore 0..1 oscillante lentamente

      // Da un blu chiaro a un blu notte
      const r = Phaser.Math.Interpolation.Linear([0x88, 0x0a], dayProgress);
      const g = Phaser.Math.Interpolation.Linear([0xa0, 0x0a], dayProgress);
      const b = Phaser.Math.Interpolation.Linear([0xff, 0x2a], dayProgress);

      const ambientColor = (r << 16) + (g << 8) + b;

      this.lights.setAmbientColor(ambientColor);
   }

   handleResumeScene(scene: Scene, data: { resumeFrom: GameSceneTypes; action?: string }) {
      this.cameras.main.fadeIn(200);
      if (data && data.resumeFrom) {
         console.log(`Scene resumed from ${data.resumeFrom}`);
         this.onResumeHook(data.resumeFrom, data);
      } else {
         console.error('resumeFrom param is necessary to trigger onResumeHook', scene.scene.key);
      }
   }
}
