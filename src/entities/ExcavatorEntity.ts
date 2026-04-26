import { Scene, Math as PhaserMath } from 'phaser';
import { RebelMachineSprite, RebelMachineModel } from '../sprites/RebelMachine';
import { EntityModel } from '../models/Entity';
import { FreddyEntity } from './FreddyEntity';
import { MessageUtils } from '../message/Message';
import { GameService } from '../GameService';
import { SynthUtils } from '../core/audio/SynthUtils';

export class ExcavatorEntity extends RebelMachineSprite {
   static excavatorKey = 'machine_excavator';
   static armKey = 'machine_excavator_arm';

   private armSprite: Phaser.GameObjects.Sprite;
   private armBaseAngle: number = 0;
   private armRotationSpeed: number = 0.002;
   private armRotationRange: number = 30; // degrees
   private debugGraphics: Phaser.GameObjects.Graphics;
   public volcanicRocks: Phaser.Physics.Arcade.Group | null = null;
   private hasFiredThisCycle: boolean = false;
   private launchCount: number = 0;
   private maxLaunches: number = 3;
   private nextStateChange: number = 0;

   constructor(scene: Scene, props: EntityModel, socketsConfig?: Array<{ x: number; y: number; id: number }>) {
      // Configuriamo 4 socket di default per l'escavatore se non passati
      const finalSockets =
         socketsConfig !== undefined
            ? socketsConfig
            : [
                 { x: 44, y: 55, id: 1 },
                 { x: 68, y: 55, id: 2 },
                 { x: 92, y: 55, id: 3 },
                 { x: 116, y: 55, id: 4 },
              ];

      super(scene, { ...props, key: ExcavatorEntity.excavatorKey }, finalSockets);

      // Aggiungiamo il braccio meccanico
      // Il fulcro del braccio è sensibile al flip
      const armOffsetX = this.flipX ? 34 : -34;
      this.armSprite = scene.add.sprite(this.x + armOffsetX, this.y - 7, ExcavatorEntity.armKey);
      this.armSprite.setOrigin(this.flipX ? 1 : 0, 0.5);
      this.armSprite.setDepth(this.depth + 2);
      this.armSprite.setPipeline('Light2D');
      this.armSprite.setFlipX(this.flipX);

      // Inizializzazione grafica di debug
      this.debugGraphics = scene.add.graphics();
      this.debugGraphics.setDepth(this.armSprite.depth + 1);

      // Inizializziamo il gruppo per i massi vulcanici
      this.volcanicRocks = this.scene.physics.add.group();

      // Creiamo le texture per i massi se non esistono
      this.#createRockTextures();
   }

   #createRockTextures() {
      const sizes = { s: 8, m: 16, l: 24 };
      Object.entries(sizes).forEach(([key, size]) => {
         const texKey = `volcanic_rock_${key}`;
         if (!this.scene.textures.exists(texKey)) {
            const g = this.scene.add.graphics();
            g.fillStyle(0x444444, 1);
            g.fillCircle(size / 2, size / 2, size / 2);
            // Effetto "vulcanico": puntini rossi/arancio
            g.fillStyle(0xff4400, 0.8);
            g.fillCircle(size / 3, size / 3, size / 4);
            g.generateTexture(texKey, size, size);
            g.destroy();
         }
      });
   }

   static createExcavator(
      scene: Scene,
      props: { x: number; y: number },
      model?: Partial<RebelMachineModel>,
      socketsConfig?: Array<{ x: number; y: number; id: number }>
   ): ExcavatorEntity {
      const entity = new ExcavatorEntity(scene, { id: self.crypto.randomUUID(), key: ExcavatorEntity.excavatorKey, ...props }, socketsConfig);
      if (model) {
         entity.setModel(model);
      }
      entity.setRebelMachineBody();
      if (entity.body) {
         entity.body.setAllowGravity(true);
         entity.body.setImmovable(false); // Deve potersi muovere per cadere
         entity.body.setGravityY(1000); // Molto pesante
      }
      return entity;
   }

   static loadAssets(scene: Scene) {
      scene.load.image(ExcavatorEntity.excavatorKey, `spritesheet/lv3/${ExcavatorEntity.excavatorKey}.png`);
      scene.load.image(ExcavatorEntity.armKey, `spritesheet/lv3/${ExcavatorEntity.armKey}.png`);
   }

   updateExcavator(time: number, player?: FreddyEntity) {
      super.update();

      // Sincronizza posizione braccio con il corpo (fulcro offset sensibile al flip)
      // Lo facciamo PRIMA del controllo isSolved così anche gli escavatori decorativi hanno il braccio attaccato
      const armOffsetX = this.flipX ? 34 : -34;
      this.armSprite.setPosition(this.x + armOffsetX, this.y - 7);

      // Sincronizziamo anche il flip e l'origine del braccio
      this.armSprite.setFlipX(this.flipX);
      this.armSprite.setOrigin(this.flipX ? 1 : 0, 0.5);

      // --- LOGICA STATI (SURRISCALDAMENTO) ---
      if (this.model.rebellionState === 'tired') {
         this.setTint(0x888888);
         this.armSprite.setTint(0x888888);
         // Vibrazione braccio bloccato
         this.armSprite.x += (Math.random() - 0.5) * 2;
         
         if (time > this.nextStateChange) {
            this.model.rebellionState = 'moving';
            this.launchCount = 0;
            this.clearTint();
            this.armSprite.clearTint();
         }
         return; // Interrompiamo movimento e fuoco
      }

      // Se non inizializzato
      if (!this.model.rebellionState) {
         this.model.rebellionState = 'moving';
      }

      // Movimento del braccio (Sine wave) - Attivo sempre per animazione ambientale
      const rotationDir = this.flipX ? -1 : 1;
      const sinValue = Math.sin(time * this.armRotationSpeed);
      const angleOffset = sinValue * this.armRotationRange * rotationDir;
      this.armSprite.setAngle(this.armBaseAngle + angleOffset);

      // --- LOGICA RIBELLIONE LIVELLO 3 ---
      if (this.model.isRebellious && !this.model.isSolved) {
         const currentEffort = sinValue * rotationDir;
         
         if (currentEffort < -0.9) { 
            if (!this.hasFiredThisCycle) {
               this.fireVolcanicRocks(player);
               this.hasFiredThisCycle = true;
               this.launchCount++;

               // Passaggio a stato incagliato dopo X lanci
               if (this.launchCount >= this.maxLaunches) {
                  this.model.rebellionState = 'tired';
                  this.nextStateChange = time + 6000; // 6 secondi di pausa
               }
            }
         } else if (currentEffort > 0) {
            this.hasFiredThisCycle = false;
         }
      }

      // Collisione manuale con il braccio (sensibile al flip)
      // Attiva per TUTTI gli escavatori (anche quelli non ribelli sono pericoli ambientali)
      if (player && player.model.status !== 'dead') {
         // Calcoliamo la posizione della punta della benna (circa 110px dal fulcro)
         const rad = PhaserMath.DegToRad(this.armSprite.angle);
         const tipOffset = this.flipX ? -145 : 145;
         const tipX = this.armSprite.x + Math.cos(rad) * tipOffset;
         const tipY = this.armSprite.y + Math.sin(rad) * tipOffset;

         const dist = PhaserMath.Distance.Between(player.x, player.y, tipX, tipY);
         const collisionRadius = 20;

         // Visualizzazione Debug
         if ((this.scene as any).gameService?.debug) {
            this.debugGraphics.clear();
            this.debugGraphics.lineStyle(2, 0xff0000, 1);
            this.debugGraphics.fillStyle(0xff0000, 0.3);
            this.debugGraphics.strokeCircle(tipX, tipY, collisionRadius);
            this.debugGraphics.fillCircle(tipX, tipY, collisionRadius);
         } else {
            this.debugGraphics.clear();
         }

         if (dist < collisionRadius) {
            player.decreaseHpStatus(player.model.lives);
            MessageUtils.getInstance().addFlyMessage({
               key: 'excavator_crush',
               text: 'SCHIACCIATO DALLA BENNA!',
            });
         }
      }

      if (this.model.isSolved) {
         this.armSprite.setTint(0x00ffff);
         if (this.volcanicRocks) this.volcanicRocks.clear(true, true);
         return;
      }
   }

   private fireVolcanicRocks(player?: FreddyEntity) {
      if (!this.volcanicRocks) return;

      // Feedback sonoro procedurale
      SynthUtils.playLaunchSound(0.5);

      const rad = this.armSprite.rotation;
      const tipOffset = this.flipX ? -145 : 145; 
      const launchX = this.armSprite.x + Math.cos(rad) * tipOffset;
      const launchY = this.armSprite.y + Math.sin(rad) * tipOffset;

      // CALCOLO MIRA PREDITTIVA VERSO FREDDY
      let targetDx = this.flipX ? -400 : 400; // Default
      if (player && player.body) {
         // Prevediamo dove sarà Freddy tra circa 0.6 secondi (tempo medio di volo)
         const predictionTime = 0.6;
         const predictedX = player.x + (player.body.velocity.x * predictionTime);
         targetDx = predictedX - launchX;
      }

      // DISTANZA PER SCALARE LA FORZA
      const dist = Math.abs(targetDx);
      const forceFactor = Phaser.Math.Clamp(dist / 800, 0.5, 1.2); // Più forza se lontano, meno se vicino

      // Moltiplicatori per i 3 massi (Corto, Mirato/Predittivo, Lungo)
      // Effetto "PALOMBELLA" adattivo
      const configs = [
         { size: 'l', vx: targetDx * 0.4, vy: -700 * forceFactor },  
         { size: 'm', vx: targetDx * 0.7, vy: -900 * forceFactor }, 
         { size: 's', vx: targetDx * 1.0, vy: -1100 * forceFactor },
      ];

      configs.forEach((cfg) => {
         const rock = this.volcanicRocks?.create(launchX, launchY, `volcanic_rock_${cfg.size}`) as Phaser.Physics.Arcade.Sprite;
         if (rock && rock.body) {
            rock.setBounce(0.2);
            rock.setCollideWorldBounds(true);
            
            // Applichiamo la velocità calcolata
            rock.setVelocity(cfg.vx, cfg.vy);
            
            // Peso extra per l'effetto caduta a piombo
            rock.setGravityY(800); 
            
            // Rotazione casuale per realismo
            rock.setAngularVelocity(Phaser.Math.Between(-400, 400));
            
            // Tint infuocato
            rock.setTint(0xffaa00);

            // Notifichiamo che è letale (gestito in Level3Collision)
            rock.setData('isVolcanicRock', true);

            // Auto-distruzione dopo 5 secondi se non colpisce nulla
            this.scene.time.delayedCall(5000, () => {
               if (rock.active) rock.destroy();
            });
         }
      });
   }

   override destroy(fromScene?: boolean): void {
      if (this.armSprite) this.armSprite.destroy();
      super.destroy(fromScene);
   }
}
