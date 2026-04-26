
/**
 * Utility for procedural sound synthesis using Web Audio API.
 * Provides chiptune-style sounds without external audio assets.
 */
export class SynthUtils {
   private static ctx: AudioContext | null = null;

   private static initContext() {
      if (!this.ctx) {
         this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
   }

   /**
    * Plays a classic chiptune 'collect' or 'success' sound.
    * A quick frequency sweep upwards with an exponential decay.
    */
   public static playCollectSound(volume: number = 0.2) {
      try {
         this.initContext();
         const now = this.ctx!.currentTime;
         
         const osc = this.ctx!.createOscillator();
         const gain = this.ctx!.createGain();

         // Tipo triangolo per un suono retro ma pulito
         osc.type = 'triangle';
         
         // Iniziamo da una nota media e saliamo velocemente (effetto 'bling')
         osc.frequency.setValueAtTime(440, now); // A4
         osc.frequency.exponentialRampToValueAtTime(880, now + 0.1); // A5

         // Inviluppo di ampiezza (Attack istantaneo, Decay veloce)
         gain.gain.setValueAtTime(volume, now);
         gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

         osc.connect(gain);
         gain.connect(this.ctx!.destination);

         osc.start(now);
         osc.stop(now + 0.2);
      } catch (e) {
         console.warn('Procedural audio failed:', e);
      }
   }

   /**
    * Plays a mechanical 'plug' or 'connect' sound.
    * A short, punchy dual-tone.
    */
   public static playConnectSound(volume: number = 0.15) {
      try {
         this.initContext();
         const now = this.ctx!.currentTime;
         
         const osc = this.ctx!.createOscillator();
         const gain = this.ctx!.createGain();

         osc.type = 'square'; // Più ruvido per un feedback meccanico
         osc.frequency.setValueAtTime(220, now); // Nota base
         osc.frequency.exponentialRampToValueAtTime(440, now + 0.05); // Salto veloce

         gain.gain.setValueAtTime(volume, now);
         gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

         osc.connect(gain);
         gain.connect(this.ctx!.destination);

         osc.start(now);
         osc.stop(now + 0.1);
      } catch (e) {
         console.warn('Procedural audio failed:', e);
      }
   }

   /**
    * Plays a low-frequency 'launch' sound for projectiles.
    * Uses a combination of a low sine sweep and a noise burst.
    */
   public static playLaunchSound(volume: number = 0.2) {
      try {
         this.initContext();
         const now = this.ctx!.currentTime;

         // Sinusoidale bassa per il 'tonfo'
         const osc = this.ctx!.createOscillator();
         const gain = this.ctx!.createGain();
         osc.type = 'sine';
         osc.frequency.setValueAtTime(150, now);
         osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);
         gain.gain.setValueAtTime(volume, now);
         gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
         osc.connect(gain).connect(this.ctx!.destination);

         // Rumore bianco per il 'soffio'
         const noiseBufferSize = this.ctx!.sampleRate * 0.1;
         const noiseBuffer = this.ctx!.createBuffer(1, noiseBufferSize, this.ctx!.sampleRate);
         const output = noiseBuffer.getChannelData(0);
         for (let i = 0; i < noiseBufferSize; i++) output[i] = Math.random() * 2 - 1;

         const noiseSource = this.ctx!.createBufferSource();
         noiseSource.buffer = noiseBuffer;
         const noiseFilter = this.ctx!.createBiquadFilter();
         noiseFilter.type = 'lowpass';
         noiseFilter.frequency.value = 800;
         const noiseGain = this.ctx!.createGain();
         noiseGain.gain.setValueAtTime(volume * 0.5, now);
         noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

         noiseSource.connect(noiseFilter).connect(noiseGain).connect(this.ctx!.destination);

         osc.start(now);
         osc.stop(now + 0.3);
         noiseSource.start(now);
      } catch (e) {}
   }

   /**
    * Plays a short 'explosion' or 'impact' noise.
    */
   public static playExplosionSound(volume: number = 0.1) {
      try {
         this.initContext();
         const now = this.ctx!.currentTime;
         const bufferSize = this.ctx!.sampleRate * 0.15;
         const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
         const data = buffer.getChannelData(0);
         for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

         const source = this.ctx!.createBufferSource();
         source.buffer = buffer;
         const filter = this.ctx!.createBiquadFilter();
         filter.type = 'lowpass';
         filter.frequency.value = 400;
         const gain = this.ctx!.createGain();
         gain.gain.setValueAtTime(volume, now);
         gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

         source.connect(filter).connect(gain).connect(this.ctx!.destination);
         source.start(now);
      } catch (e) {}
   }

   /**
    * Plays a short 'blip' sound for UI or minor feedback.
    */
   public static playBlip(freq: number = 660, duration: number = 0.05) {
      try {
         this.initContext();
         const now = this.ctx!.currentTime;
         const osc = this.ctx!.createOscillator();
         const gain = this.ctx!.createGain();

         osc.type = 'sine';
         osc.frequency.setValueAtTime(freq, now);

         gain.gain.setValueAtTime(0.1, now);
         gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

         osc.connect(gain);
         gain.connect(this.ctx!.destination);

         osc.start(now);
         osc.stop(now + duration);
      } catch (e) {
         console.warn('Procedural audio failed:', e);
      }
   }
}
