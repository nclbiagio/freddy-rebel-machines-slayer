
/**
 * Procedural Wind Sound Generator using Web Audio API.
 * Simulates wind gusts without external audio files.
 */
export class StormSound {
   private ctx: AudioContext | null = null;
   private windSource: AudioBufferSourceNode | null = null;
   private windGain: GainNode | null = null;
   private windFilter: BiquadFilterNode | null = null;
   private isPlaying: boolean = false;
   private lfoInterval: any = null;

   constructor() {}

   private initContext() {
      if (!this.ctx) {
         this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
   }

   private createNoiseBuffer(): AudioBuffer {
      const bufferSize = 2 * this.ctx!.sampleRate;
      const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
         output[i] = Math.random() * 2 - 1;
      }
      return buffer;
   }

   public play() {
      if (this.isPlaying) return;
      this.initContext();
      
      const buffer = this.createNoiseBuffer();

      // --- WIND SETUP ---
      this.windFilter = this.ctx!.createBiquadFilter();
      this.windFilter.type = 'lowpass';
      this.windFilter.frequency.value = 300;
      this.windFilter.Q.value = 5; 

      this.windGain = this.ctx!.createGain();
      this.windGain.gain.value = 0.03;

      this.windSource = this.ctx!.createBufferSource();
      this.windSource.buffer = buffer;
      this.windSource.loop = true;

      this.windSource
         .connect(this.windFilter)
         .connect(this.windGain)
         .connect(this.ctx!.destination);

      // Start
      this.windSource.start();
      this.isPlaying = true;

      // --- WIND LFO (Gusts simulation) ---
      this.lfoInterval = setInterval(() => {
         if (this.windFilter && this.ctx) {
            const nextFreq = Math.random() * 500 + 150;
            const nextGain = Math.random() * 0.05 + 0.02;
            const time = this.ctx.currentTime + 2;
            
            this.windFilter.frequency.exponentialRampToValueAtTime(nextFreq, time);
            this.windGain?.gain.linearRampToValueAtTime(nextGain, time);
         }
      }, 3000);
   }

   public stop(immediate = false) {
      if (!this.isPlaying) return;
      
      if (this.lfoInterval) {
         clearInterval(this.lfoInterval);
         this.lfoInterval = null;
      }
      
      if (immediate) {
         try {
            this.windSource?.stop();
         } catch (e) {}
         this.isPlaying = false;
         return;
      }

      const fadeTime = 1.5;
      const now = this.ctx!.currentTime;
      
      this.windGain?.gain.cancelScheduledValues(now);
      this.windGain?.gain.linearRampToValueAtTime(0, now + fadeTime);
      
      setTimeout(() => {
         try {
            this.windSource?.stop();
         } catch (e) {}
         this.isPlaying = false;
      }, fadeTime * 1000);
   }
}
