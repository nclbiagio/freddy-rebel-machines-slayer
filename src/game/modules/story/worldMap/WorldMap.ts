import { Scene } from 'phaser';
import { GameSceneTypes, GameService } from '../../../../GameService';
import { MusicTracker } from '../../../../core/audio/MusicTracker';
import { EventBus } from '../../../../EventBus';
import { SceneData } from '../../../../models/Game';
import { worldMap } from './worldMapData';
import { MapLocation } from '../../../../models/Map';
import { ProgressManager } from '../../../../core/systems/ProgressManager';

type ExtendedSceneData = (SceneData & { locationId?: string }) | undefined; //You can extend here SceneData like (SceneData & { enemyId: string }) | undefined;

export class WorldMapScene extends Scene {
   static sceneKey: GameSceneTypes = 'WorldMap';
   #data: ExtendedSceneData;
   #gameService = GameService.getInstance();
   protected musicTracker = new MusicTracker(this, WorldMapScene.sceneKey);
   protected musicCleanup: (() => void) | null = null;
   #storyProgress = ProgressManager.getInstance();
   protected mapData: MapLocation[] = worldMap;

   mode: 'macro' | 'submap' = 'macro';

   constructor(key: string = WorldMapScene.sceneKey) {
      super({
         key: key,
      });
   }

   init(data: ExtendedSceneData) {
      this.#data = data;
      this.#gameService.scene$.next(WorldMapScene.sceneKey);
      if (!this.#gameService.debug) {
         this.musicCleanup = this.musicTracker.initSceneSoundTrackEvents(true);
      }
   }

   create() {
      this.createSceneEvents();
      this.createSceneInputEvents();
      this.createMap();

      // CLEANUP on shutdown to avoid duplicated listeners when re-entering the map
      this.events.once('shutdown', () => {
         EventBus.off('world-map:location-selected');
         EventBus.off('world-map:sub-location-selected');
         if (this.musicCleanup) {
            this.musicCleanup();
         }
      });
   }

   createSceneEvents() {
      EventBus.on('world-map:location-selected', (data: { id: GameSceneTypes }) => {
         const location = this.mapData.find((loc) => loc.id === data.id);
         if (location && location.subLocations && location.subLocations.length > 0) {
            if (this.#gameService.type === 'Novel') {
               this.#gameService.nextSceneFromTimeline(WorldMapScene.sceneKey, this, 'ChapterTravel');
            } else {
               // Sub-locations not fully implemented for non-novel yet, simple fallback
               console.warn('Sub-locations for non-novel not implemented');
            }
         } else if (location) {
            if (this.musicCleanup) {
               this.musicCleanup();
               this.musicCleanup = null;
            }
            if (this.#gameService.type === 'Novel') {
               this.#gameService.nextSceneFromTimeline(this.scene.key as GameSceneTypes, this, data.id, this.#data);
            } else {
               this.#gameService.travelToScene(data.id, this.scene.key as GameSceneTypes, this, this.#data);
            }
         } else {
            console.error('Location not found');
         }
      });

      EventBus.on('world-map:sub-location-selected', (data: { id: GameSceneTypes; subId: GameSceneTypes }) => {
         if (this.#gameService.type === 'Novel') {
            this.#gameService.nextSceneFromTimeline(WorldMapScene.sceneKey, this, 'ChapterTravel');
         }
      });
   }

   createSceneInputEvents() {
      //remove audio
      this.input.keyboard?.on('keydown-Q', () => {
         this.musicTracker.toggleSoundtrack();
      });
   }

   createMap() {
      if (this.mapData.length === 0 || !this.mapData) {
         console.log('Nothing will be displayed, worldMap is empty or not exists!');
      }
      setTimeout(() => {
         if (this.#data?.locationId) {
            this.loadSubMap();
         } else {
            this.loadMacroMap();
         }
      }, 0);
   }

   loadSubMap() {
      // siamo in una sotto-mappa
      const parent = this.mapData.find((l) => l.subLocations && l.subLocations?.find((sub: { id: string | undefined }) => sub.id === this.#data?.locationId));
      if (!parent) {
         console.warn('locationId not valid');
         return;
      }
      this.mode = 'submap';
      const subLocations = parent.subLocations ?? [];

      // Valuta isCompleted, visited ecc. come hai fatto prima
      const locations = subLocations.map((loc: MapLocation) => {
         const unlocked = this.evaluateUnlockConditions(loc);
         const isCompleted = loc.isCompleted;

         return {
            ...loc,
            unlocked,
            isCompleted,
            isVisited: false,
         };
      });

      EventBus.emit('world-map:submap-update', {
         parent,
         locations,
      });
   }

   loadMacroMap() {
      const locations = this.mapData.map((loc) => {
         const unlocked = this.evaluateUnlockConditions(loc);
         const isCompleted = this.evaluateCompletion(loc);
         const hasNewContent = this.checkForNewContent(loc);

         return {
            ...loc,
            unlocked,
            isCompleted,
            hasNewContent,
         };
      });

      EventBus.emit('world-map:update', locations);
   }

   evaluateUnlockConditions(location: MapLocation): boolean {
      if (!location.unlockConditions || location.unlockConditions.length === 0) {
         return true;
      }
      return location.unlockConditions.every((condition) => {
         // expand here
         return this.#storyProgress.hasReadMessage(condition.value) || this.#storyProgress.hasEvent(condition.value);
      });
   }

   evaluateCompletion(location: MapLocation): boolean {
      if (location.subLocations && location.subLocations.length > 0) {
         return location.subLocations.every((sl) => this.#storyProgress.isSceneCompleted(sl.id));
      }
      return this.#storyProgress.isSceneCompleted(location.id);
   }

   checkForNewContent(location: MapLocation): boolean {
      return location.subLocations?.some((sl) => !this.#storyProgress.isSceneVisited(sl.id) && !this.#storyProgress.isSceneCompleted(sl.id)) ?? false;
   }
}
