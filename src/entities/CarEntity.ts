import { RebelMachineSprite, RebelMachineModel } from '../sprites/RebelMachine';
import { Scene } from 'phaser';
import { EntityModel } from '../models/Entity';

export class CarEntity extends RebelMachineSprite {
   static key = 'machine_car';
   private sparkEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

   constructor(scene: Scene, props: EntityModel, socketsConfig?: Array<{ x: number; y: number; id: number }>) {
      // 2 Socket posizionati sulle ruote (su corpo 128x64)
      const finalSockets = socketsConfig !== undefined ? socketsConfig : [
         { x: 27, y: 54, id: 1 }, // Ruota Anteriore
         { x: 97, y: 54, id: 2 }, // Ruota Posteriore
      ];
      super(scene, props, finalSockets);
      
      this.setDepth(10);
      if (this.body) {
         this.body.setSize(110, 40); // Hitbox più bassa e centrata sul corpo dell'auto
         this.body.setOffset(10, 24);
      }
   }

   static create(scene: Scene, props: { x: number; y: number }, model?: Partial<RebelMachineModel>, socketsConfig?: Array<{ x: number; y: number; id: number }>): CarEntity {
      const entity = new CarEntity(scene, { id: self.crypto.randomUUID(), key: CarEntity.key, ...props }, socketsConfig);
      if (model) {
         entity.setModel(model);
      }
      return entity;
   }

   static loadSpritesheet(scene: Scene) {
      scene.load.image(CarEntity.key, `spritesheet/${CarEntity.key}.png`);
   }

   override update() {
      super.update();

      // Logica di evidenziazione specifica (Debug: Rosso=Moving, Arancio=Sparking, Grigio=Tired)
      if (!this.model.isSolved && this.model.isRebellious) {
         if (this.model.rebellionState === 'moving') {
            this.setTint(0xff0000); // Rosso mentre corre
         } else if (this.model.rebellionState === 'sparking') {
            this.setTint(0xffaa00); // Arancio in sovraccarico
         } else if (this.model.rebellionState === 'tired') {
            this.setTint(0xaaaaaa); // Grigio quando è stanca
         }

         if (this.body) {
            // Forziamo lo sblocco fisico e hitbox standard
            this.body.enable = true;
            this.body.setImmovable(false);
            this.body.setAllowGravity(true);
            this.applyRebellionPattern();
         }
      }
   }

   private applyRebellionPattern() {
      if (!this.body) return;

      const now = this.scene.time.now;
      const speed = this.model.chaosSpeed || 200;
      
      this.body.setFriction(0, 0);

      // Inizializzazione stato
      if (!this.model.rebellionState) {
         this.model.rebellionState = 'moving';
         this.model.moveDirection = 1;
         this.model.nextStateChange = now + 3000;
         this.y -= 2; // Unstick
      }

      // Gestione Transizioni: moving -> sparking -> tired -> moving
      if (now > (this.model.nextStateChange || 0)) {
         if (this.model.rebellionState === 'moving') {
            this.model.rebellionState = 'sparking';
            this.model.nextStateChange = now + 2000; // Scintille per 2s
            this.createSparks();
         } else if (this.model.rebellionState === 'sparking') {
            this.model.rebellionState = 'tired';
            this.model.nextStateChange = now + 2000; // Stanca per 2s
            this.stopSparks();
         } else {
            this.model.rebellionState = 'moving';
            this.model.moveDirection = (this.model.moveDirection || 1) * -1;
            this.model.nextStateChange = now + 3000; // Corre per 3s
            this.y -= 2; // Piccolo colpetto verso l'alto ad ogni ripartenza per sbloccarsi
         }
      }

      // Gestione Comportamenti
      if (this.model.rebellionState === 'moving') {
         this.body.setImmovable(false);
         this.body.setAllowGravity(true);
         this.body.setDragX(0);
         this.body.setFriction(0, 0);
         this.body.setBounce(0.2, 0);
         
         this.body.setVelocityX(speed * (this.model.moveDirection || 1));
         this.setRotation(0);
         this.setFlipX(this.model.moveDirection === -1);
         
         // Hitbox fissa 110x40
         this.body.setSize(110, 40);
         this.body.setOffset(10, 24);

         // Rimbalzo sui bordi: invertiamo solo se stiamo andando VERSO il muro che ci blocca
         const isBlockedAny = this.body.blocked.left || this.body.blocked.right || this.body.touching.left || this.body.touching.right;
         const movingIntoWall = (this.body.blocked.left && this.model.moveDirection === -1) || 
                                (this.body.blocked.right && this.model.moveDirection === 1);

         if (movingIntoWall) {
            this.model.moveDirection = (this.model.moveDirection || 1) * -1;
            // Diamo un piccolo colpetto immediato per staccarci dal muro
            this.body.setVelocityX(speed * this.model.moveDirection);
         }
      } else if (this.model.rebellionState === 'sparking') {
         // STATO SCINTILLE (PERICOLOSO)
         this.body.setVelocityX(0);
         this.setRotation(0);
         
         // Invece di spostare x/y, usiamo un leggero jitter visivo con il tint
         if (Math.random() > 0.5) {
            this.setTint(0xffaa00);
         } else {
            this.setTint(0xff5500);
         }

         // LOGICA DI DANNO: Se Freddy è troppo vicino, muore
         const player = (this.scene as any).player;
         if (player && player.active && player.die) {
            const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
            if (dist < 110) { // Raggio letale
               player.die();
            }
         }
      } else if (this.model.rebellionState === 'tired') {
         // STATO STANCA (SICURO)
         this.body.setVelocityX(0);
         this.setRotation(0);
         this.clearTint();
         this.setTint(0xaaaaaa);
      }
   }

   private createSparks() {
      if (this.sparkEmitter) return;

      const graphics = this.scene.add.graphics();
      graphics.fillStyle(0xffffff, 1);
      graphics.fillCircle(2, 2, 2);
      graphics.generateTexture('spark_particle', 4, 4);
      graphics.destroy();

      this.sparkEmitter = this.scene.add.particles(0, 0, 'spark_particle', {
         speed: { min: 100, max: 250 },
         angle: { min: 0, max: 360 },
         scale: { start: 1, end: 0 },
         blendMode: 'ADD',
         lifespan: 400,
         gravityY: 300,
         tint: [0xffaa00, 0xff0000, 0xffff00],
         frequency: 20
      });

      this.sparkEmitter.startFollow(this);
   }

   private stopSparks() {
      if (this.sparkEmitter) {
         this.sparkEmitter.stop();
         this.scene.time.delayedCall(500, () => {
            if (this.sparkEmitter) {
               this.sparkEmitter.destroy();
               this.sparkEmitter = null;
            }
         });
      }
   }
}
