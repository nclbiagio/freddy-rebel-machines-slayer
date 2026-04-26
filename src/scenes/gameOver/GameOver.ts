import { Scene } from 'phaser';
import { EventBus } from '../../EventBus';
import { GameService } from '../../GameService';
import { MusicTracker } from '../../core/audio/MusicTracker';
import { LevelStore } from '../../game/state/LevelStore';
import { CableEntity } from '../../entities/CableEntity';

export class GameOverScene extends Scene {
   #gameService = GameService.getInstance();
   #levelStore = LevelStore.getInstance();

   #musicTracker = new MusicTracker(this, 'GameOver', 'gameOver');
   #cables: CableEntity[] = [];

   constructor() {
      super({
         key: 'GameOver',
      });
   }

   init() {
      this.#gameService.scene$.next('GameOver');

      const restartHandler = () => {
         //this.#levelStore.dataLevel$.next({});
         this.#gameService.scene$.next('MenuStart');
         this.scene.start('MenuStart');
      };

      EventBus.on('restart-game', restartHandler);

      let musicCleanup: (() => void) | null = null;
      if (!this.#gameService.debug) {
         musicCleanup = this.#musicTracker.initSceneSoundTrackEvents(false);
      }

      this.events.once('shutdown', () => {
         EventBus.off('restart-game', restartHandler);
         if (musicCleanup) {
            musicCleanup();
         }
      });
   }

   preload() {
      // Carichiamo lo spritesheet del cavo se non è già presente
      CableEntity.loadSpritesheet(this);
   }

   create() {
      this.createSceneInputEvents();
      this.createDanglingCables();
   }

   private createDanglingCables() {
      const { width } = this.scale;
      // Posizioni orizzontali approssimative sotto le lettere di "GAME OVER"
      const xPositions = [width * 0.35, width * 0.45, width * 0.55, width * 0.65];
      const colors: ('red' | 'blue' | 'yellow' | 'green')[] = ['red', 'blue', 'yellow', 'green'];

      xPositions.forEach((x, index) => {
         const cable = CableEntity.create(this, { 
            x: x, 
            y: 250 // Ancoraggio sotto la scritta Vue
         }, {
            color: colors[index % colors.length],
            maxLength: 80 + Math.random() * 60, // Lunghezze ridotte
            status: 'idle'
         });

         // Forza la caduta libera e attiva la fisica pesante
         cable.drop();
         if (cable.body) {
            cable.body.setGravityY(800);
            // Diamo un colpetto iniziale casuale
            cable.body.setVelocityX((Math.random() - 0.5) * 100);
         }
         
         this.#cables.push(cable);
      });
   }

   createSceneInputEvents() {
      //remove audio
      this.input.keyboard?.on('keydown-Q', () => {
         this.#musicTracker.toggleSoundtrack();
      });
   }
}
