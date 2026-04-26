import { GameObjects } from 'phaser';

export interface Explosion {
   particleEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null;
   explosionGraphics: GameObjects.Graphics | null;
}

export class ExplosionService {
   private static _instance: ExplosionService;
   #scene: Phaser.Scene | null;
   sceneName: string | undefined;

   fireball: Explosion = {
      particleEmitter: null,
      explosionGraphics: null,
   };

   thunder: Explosion = {
      particleEmitter: null,
      explosionGraphics: null,
   };

   acid: Explosion = {
      particleEmitter: null,
      explosionGraphics: null,
   };

   volcanic: Explosion = {
      particleEmitter: null,
      explosionGraphics: null,
   };

   constructor(scene: Phaser.Scene, sceneName?: string) {
      this.#scene = scene;
      this.sceneName = sceneName;
   }

   static getInstance(scene: Phaser.Scene, sceneName?: string): ExplosionService {
      if (this._instance) {
         //this means the scene has changed so a new Istance must be created
         if (sceneName && this._instance.sceneName !== sceneName) {
            const msg = this._instance.sceneName ? ` and will replace ${this._instance.sceneName},` : ','
            console.log(
               `[Explosion] ${sceneName} has been initialized${msg} new ExplosionService istance will be created on top of ${sceneName}`
            );
            this._instance = new ExplosionService(scene, sceneName);
         }
         return this._instance;
      }

      this._instance = new ExplosionService(scene, sceneName);
      return this._instance;
   }

   setupFireball() {
      this.#createFireballExplosionsGraphics();
      this.#createEmittersForFireballExplosion();
   }

   setupThunder() {
      this.#createThunderExplosionsGraphics();
      this.#createEmittersForThunderExplosion();
   }

   setupAcid() {
      this.#createAcidExplosionsGraphics();
      this.#createEmittersForAcidExplosion();
   }

   setupVolcanic() {
      this.#createVolcanicExplosionsGraphics();
      this.#createEmittersForVolcanicExplosion();
   }

   getByType(type: string) {
      if (type && type === 'fireball') {
         return this.fireball;
      }
      if (type && type === 'thunder') {
         return this.thunder;
      }
      if (type && type === 'acid') {
         return this.acid;
      }
      if (type && type === 'volcanic') {
         return this.volcanic;
      }
   }

   explode(target: Phaser.GameObjects.Sprite | { x: number; y: number }, type: string, quantity: number = 20) {
      const explosion = this.getByType(type);
      if (explosion && explosion.particleEmitter) {
         explosion.particleEmitter.explode(quantity, target.x, target.y);
      }
   }

   #createFireballExplosionsGraphics() {
      if (this.#scene) {
         this.fireball.explosionGraphics = this.#scene.add.graphics();
         this.fireball.explosionGraphics.fillStyle(0xff0000, 1); // Colore bianco pieno
         this.fireball.explosionGraphics.fillRect(0, 0, 2, 2); // Rettangolo 1x1
         this.fireball.explosionGraphics.generateTexture('pixelRed', 2, 2); // Texture 'pixel'
         this.fireball.explosionGraphics.destroy();
      }
   }

   #createEmittersForFireballExplosion() {
      if (this.#scene) {
         this.fireball.particleEmitter = this.#scene.add.particles(0, 0, 'pixelRed', {
            speed: { min: 100, max: 200 },
            angle: { min: 0, max: 360 },
            scale: { start: 2, end: 0 },
            lifespan: { min: 300, max: 800 },
            gravityY: 300,
            blendMode: 'NORMAL',
            quantity: 30,
            emitting: false,
            visible: false,
         });
      }
   }

   #createThunderExplosionsGraphics() {
      if (this.#scene) {
         this.thunder.explosionGraphics = this.#scene.add.graphics();
         this.thunder.explosionGraphics.fillStyle(0x66ccff, 1);
         this.thunder.explosionGraphics.fillRect(0, 0, 4, 4); // Rettangolo 1x1
         this.thunder.explosionGraphics.generateTexture('pixelBlue', 4, 4); // Texture 'pixel'
         this.thunder.explosionGraphics.destroy();
      }
   }

   #createEmittersForThunderExplosion() {
      if (this.#scene) {
         this.thunder.particleEmitter = this.#scene.add.particles(0, 0, 'pixelBlue', {
            speedY: { min: -100, max: -300 }, // Movimento SOLO verso l'alto
            angle: { min: 90, max: 90 }, // Angolo fisso (verticale verso l'alto)
            scale: { start: 2, end: 0 }, // Dissolvenza graduale
            lifespan: { min: 300, max: 800 },
            blendMode: 'ADD',
            quantity: 20,
            emitting: false,
            visible: false,
         });
      }
   }

   #createAcidExplosionsGraphics() {
      if (this.#scene) {
         this.acid.explosionGraphics = this.#scene.add.graphics();
         this.acid.explosionGraphics.fillStyle(0x00ff00, 1);
         this.acid.explosionGraphics.fillRect(0, 0, 4, 4);
         this.acid.explosionGraphics.generateTexture('pixelGreen', 4, 4);
         this.acid.explosionGraphics.destroy();
      }
   }

   #createEmittersForAcidExplosion() {
      if (this.#scene) {
         this.acid.particleEmitter = this.#scene.add.particles(0, 0, 'pixelGreen', {
            speed: { min: 100, max: 250 }, // Più veloce
            angle: { min: 0, max: 360 },
            scale: { start: 2.5, end: 0 }, // Più grande all'inizio
            lifespan: { min: 400, max: 700 }, // Più persistente
            gravityY: 500,
            blendMode: 'NORMAL',
            quantity: 20,
            emitting: false, // FIX: Non emettere nulla all'avvio a (0,0)
            visible: true, 
         });
         this.acid.particleEmitter.setDepth(1000); // In primo piano assoluto
      }
   }

   #createVolcanicExplosionsGraphics() {
      if (this.#scene) {
         this.volcanic.explosionGraphics = this.#scene.add.graphics();
         this.volcanic.explosionGraphics.fillStyle(0x666666, 1); // Grigio roccia
         this.volcanic.explosionGraphics.fillRect(0, 0, 6, 6);
         this.volcanic.explosionGraphics.generateTexture('pixelGrey', 6, 6);
         this.volcanic.explosionGraphics.destroy();
      }
   }

   #createEmittersForVolcanicExplosion() {
      if (this.#scene) {
         this.volcanic.particleEmitter = this.#scene.add.particles(0, 0, 'pixelGrey', {
            speed: { min: 150, max: 300 },
            angle: { min: 0, max: 360 },
            scale: { start: 2, end: 0 },
            lifespan: { min: 400, max: 800 },
            gravityY: 600,
            blendMode: 'NORMAL',
            quantity: 25,
            emitting: false,
            visible: true,
         });
         this.volcanic.particleEmitter.setDepth(1000);
      }
   }

   reset() {
      this.#scene = null;
   }
}
