import { Scene } from 'phaser';
import { GameSceneTypes, GameService } from '../../GameService';
import { EventBus } from '../../EventBus';
import { PlayerStateService } from '../../game/state/PlayerState';
import { SceneData } from '../../models/Game';
import { equippedItems, usableItemsMock } from './inventoryMockData';

export class InventoryScene extends Scene {
   #gameService = GameService.getInstance();
   #playerState = PlayerStateService.getInstance();
   #data: SceneData | undefined;
   fromScene: GameSceneTypes | null = null;

   constructor() {
      super({
         key: 'Inventory',
      });
   }

   init(data: SceneData) {
      this.#data = data;
      this.fromScene = this.#gameService.scene$.getValue();
      this.#gameService.scene$.next('Inventory');
      if (this.#data.toDebug) {
         this.#playerState.addUsabeItems(usableItemsMock);
         this.#playerState.addEquippedItems(equippedItems);
         console.log('Inventory has started in DEBUG mode');
      }
   }

   create() {
      this.createSceneInputsEvents();
      EventBus.on('close-inventory', () => {
         this.closeInventory();
      });
   }

   closeInventory() {
      const prevScene = this.#gameService.prevScene$.value;
      if (prevScene) {
         this.scene.stop(); // Chiudi l'inventario
         this.scene.resume(prevScene, { resumeFrom: 'Inventory' }); // Riprendi la scena principale
         this.#gameService.scene$.next(prevScene);
      } else {
         console.error(`Error: ${prevScene} not valid`);
      }
   }

   createSceneInputsEvents() {
      this.input.keyboard?.on('keydown-ESC', () => {
         this.closeInventory();
      });
   }
}
