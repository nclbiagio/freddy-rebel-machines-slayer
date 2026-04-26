import { WorldMapScene } from '../../../game/modules/story/worldMap/WorldMap';
import { GameSceneTypes, GameService } from '../../../GameService';
import { worldMap } from './mapData';
import { MapLocation } from '../../../models/Map';
import { ProgressManager } from '../../../core/systems/ProgressManager';

import { MusicTracker } from '../../../core/audio/MusicTracker';
import { SceneData } from '../../../models/Game';

export class MapScene extends WorldMapScene {
   static sceneKey: GameSceneTypes = 'MapScene';

   constructor() {
      super(MapScene.sceneKey);
      this.mapData = worldMap;
      this.musicTracker = new MusicTracker(this, MapScene.sceneKey, 'levelSelect');
   }

   override init(data: (SceneData & { locationId?: string }) | undefined) {
      super.init(data);
   }

   override evaluateUnlockConditions(location: MapLocation): boolean {
      // 1. Static Unlock (e.g. SafePoint, Chapter1 start)
      if (location.unlocked) return true;

      // 2. Dynamic Unlock: Check if any connected neighbor is completed
      const progressManager = ProgressManager.getInstance();

      // Check neighbors
      if (location.connectedTo) {
         return location.connectedTo.some((neighborId) => {
            return progressManager.isSceneCompleted(neighborId);
         });
      }

      return false;
   }
}
