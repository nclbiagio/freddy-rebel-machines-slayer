import { EventBus } from '../../EventBus';
import { GameService } from '../../GameService';
import { PlayerState } from '../../models/EquipmentAndStats';
import { LevelStore } from '../state/LevelStore';
import { loadPlayerFromStore, savePlayerToStore } from '../factories/PlayerFactory';
import { PlayerStateService } from '../state/PlayerState';
import { Scene } from 'phaser';

export const setupPlayerPersistence = (scene: Scene) => {
   const gameService = GameService.getInstance();
   const levelStore = LevelStore.getInstance();
   const playerStateService = PlayerStateService.getInstance();

   const currentGameScene = gameService.scene$.getValue();

   if (!currentGameScene) return;

   // 1. Initial Load
   // Try to load data from store for the current scene
   const persistedState = loadPlayerFromStore(currentGameScene);
   if (persistedState) {
      // We need a way to hydration the service WITHOUT triggering a save loop immediately
      // Ideally PlayerStateService should have a 'hydrate' or 'load' method
      // For now, we might need to expose one or rely on internal logic if we modify PlayerStateService
      // But since we are decoupling, let's assume we can push this state into the service.
      // NOTE: We need to add a 'hydrate' method to PlayerStateService to accept this clean state object.
      playerStateService.hydrate(persistedState);
      if (gameService.debug) {
         console.log(`[PlayerPersistence] Hydrated player from store for ${currentGameScene}`);
      }
   }

   if (!levelStore.isSessionStorageEnabled) return;

   // 2. Persistence Listener
   const onPlayerStateUpdated = (state: PlayerState) => {
      // Debounce could be handled here or by the emitter.
      // If the emitter sends every single change, we might want a small timeout here.
      // For simplicity, let's save direct, or use a simple timer if performance hits.

      const currentScene = gameService.scene$.getValue();
      if (currentScene) {
         savePlayerToStore(currentScene, state);
         if (gameService.debug) {
            // Console log disabled to avoid spam, enable if debugging specific issues
            // console.log(`[PlayerPersistence] Saved state for ${currentScene}`);
         }
      }
   };

   EventBus.on('player:state-updated', onPlayerStateUpdated);

   // Cleanup
   scene.events.once('shutdown', () => {
      EventBus.off('player:state-updated', onPlayerStateUpdated);
   });
};
