import { EventBus } from '../../EventBus';
import { GameSceneTypes, GameService } from '../../GameService';

export class MusicTracker {
   scene: Phaser.Scene;
   currentScene: GameSceneTypes;
   music!: Phaser.Sound.NoAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound;
   musicFileName = 'game-base-soundtrack';
   musicIsPlaying = GameService.getInstance().musicIsPlaying$.getValue();
   autoPlay = false;
   constructor(scene: Phaser.Scene, currentScene: GameSceneTypes, musicFileName = '', autoPlay?: boolean) {
      this.scene = scene;
      this.currentScene = currentScene;
      if (!!musicFileName) {
         this.musicFileName = musicFileName;
      }
      if (!!autoPlay) {
         this.autoPlay = autoPlay;
      }
   }

   initSceneSoundTrackEvents(loop = true) {
      const gs = GameService.getInstance();
      
      // STOP any previous instance of this music globally to avoid layering
      this.scene.sound.stopByKey(this.musicFileName);
      
      this.music = this.scene.sound.add(this.musicFileName, { loop });
      
      // Respect the global state: only play if it's currently enabled
      const isMuted = !gs.musicIsPlaying$.getValue();
      
      if (!isMuted && this.music) {
         if (!this.music.isPlaying) {
            this.music.play({ volume: 0.2 });
         }
      }

      const playHandler = () => {
         this.musicIsPlaying = true;
         gs.musicIsPlaying$.next(this.musicIsPlaying);
         if (this.music && !this.music.isPlaying) {
            this.music.play({ volume: 0.2 });
         }
      };

      const stopHandler = () => {
         if (this.music) {
            this.musicIsPlaying = false;
            gs.musicIsPlaying$.next(this.musicIsPlaying);
            this.music.stop();
         }
      };

      EventBus.on(`play-sound-${this.currentScene}`, playHandler);
      EventBus.on(`stop-sound-${this.currentScene}`, stopHandler);

      return () => {
         EventBus.off(`play-sound-${this.currentScene}`, playHandler);
         EventBus.off(`stop-sound-${this.currentScene}`, stopHandler);
         // STOP the music when cleaning up the tracker for this scene
         if (this.music) {
            this.music.stop();
         }
      };
   }

   stopTrackOnly() {
      if (this.music) {
         this.music.stop();
      }
   }

   stopSoundTrack() {
      if (this.musicIsPlaying && this.music) {
         const gs = GameService.getInstance();
         this.musicIsPlaying = false;
         gs.musicIsPlaying$.next(this.musicIsPlaying);
         this.music.stop();
      }
   }

   resumeSoundtrack() {
      if (!this.musicIsPlaying && this.music) {
         const gs = GameService.getInstance();
         this.musicIsPlaying = true;
         gs.musicIsPlaying$.next(this.musicIsPlaying);
         this.music.play({
            volume: 0.2,
         });
      }
   }

   toggleSoundtrack() {
      const gs = GameService.getInstance();
      if (!gs.musicIsPlaying$.getValue()) {
         this.resumeSoundtrack();
      } else {
         this.stopSoundTrack();
      }
   }
}
