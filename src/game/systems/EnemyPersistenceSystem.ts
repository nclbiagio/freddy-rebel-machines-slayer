import { EventBus } from '../../EventBus';
import { GameSceneTypes, GameService } from '../../GameService';
import { LevelStore } from '../state/LevelStore';
import { SharedEnemyData } from '../../models/Game';

export const setupEnemyPersistence = (scene: Phaser.Scene) => {
   const levelStore = LevelStore.getInstance();
   const gameService = GameService.getInstance();

   // If session storage is disabled, we don't persist enemy state
   if (!levelStore.isSessionStorageEnabled) return;

   const onEnemyDead = (data: SharedEnemyData) => {
      const currentGameScene = gameService.scene$.getValue() as GameSceneTypes;
      if (!currentGameScene || !levelStore.dataLevel[currentGameScene]?.enemies) return;

      const currentEnemies = levelStore.dataLevel[currentGameScene]!.enemies!;
      const enemyIndex = currentEnemies.findIndex((e) => e.id === data.id);

      if (enemyIndex !== -1) {
         // Create a new array to ensure immutability/reactivity
         const updatedEnemies = [...currentEnemies];
         updatedEnemies[enemyIndex] = {
            ...updatedEnemies[enemyIndex],
            status: 'dead',
            lives: 0,
         };

         // Update the store
         levelStore.setLevelStore(currentGameScene, { enemies: updatedEnemies });

         if (gameService.debug) {
            console.log(`[EnemyPersistence] Enemy ${data.id} marked as dead in store.`);
         }
      }
   };

   if (gameService.debug) {
      console.log('[EnemyPersistence] Listener setup');
   }
   EventBus.on('enemy-dead', onEnemyDead);

   // Cleanup on scene shutdown
   scene.events.once('shutdown', () => {
      if (gameService.debug) {
         console.log('[EnemyPersistence] Shutdown detected - Removing listener');
      }
      EventBus.off('enemy-dead', onEnemyDead);
   });
};
