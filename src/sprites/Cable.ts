import { Physics, Scene } from 'phaser';
import { EntityModel } from '../models/Entity';

export type CableColor = 'red' | 'blue' | 'green' | 'yellow';
export type CableStatus = 'idle' | 'held' | 'connected';

export interface CableModel extends EntityModel {
   color: CableColor;
   status: CableStatus;
   anchorId?: string; // Se è collegato ad una Macchina o Entità fissa
   anchorOffsetX: number; // Offset rispetto al centro dell'anchor
   anchorOffsetY: number;
   maxLength: number;
   baseMaxLength?: number;
   targetMaxLength?: number;

   // Parametri Difficoltà
   connectedMaxLength?: number;
   impulseInterval?: { min: number; max: number };
   impulseDuration?: number;
   shockIntensity?: number;
   shockFrequency?: number;
}

export class CableSprite extends Physics.Arcade.Sprite {
   public model: CableModel;
   declare body: Physics.Arcade.Body;
   private wireGraphic: Phaser.GameObjects.Graphics;

   // Punti fittizi per l'ancoraggio (base solida da cui parte il filo)
   public currentAnchorX: number = 0;
   public currentAnchorY: number = 0;

   private timeTick: number = 0;
   private nextImpulseTime: number = 5000; // Primo impulso dopo 5 secondi per farli cadere
   private impulseDurationCounter: number = 0;
   private isImpulsing: boolean = false;
   public lastDropTime: number = 0;

   private sparkEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

   static key = 'cable';

   constructor(scene: Scene, props: EntityModel) {
      super(scene, props.x, props.y, props.key);

      this.model = {
         color: 'red',
         status: 'idle',
         anchorOffsetX: 0,
         anchorOffsetY: 0,
         maxLength: 200,
         connectedMaxLength: 550,
         impulseInterval: { min: 3000, max: 6000 },
         impulseDuration: 600,
         shockIntensity: 4.0,
         shockFrequency: 60,
         ...props,
      } as CableModel;

      this.model.baseMaxLength = this.model.maxLength;
      this.model.targetMaxLength = this.model.maxLength;
      this.currentAnchorX = props.x;
      this.currentAnchorY = props.y;
      this.name = this.model.id; // Necessario per getByName durante la disconnessione

      scene.add.existing(this);
      scene.physics.add.existing(this);

      // La grafica per disegnare materialmente la linea/fune
      this.wireGraphic = scene.add.graphics();
      // Deve essere sopra la macchina (depth 10)
      this.wireGraphic.setDepth(15);
      this.setDepth(20); // La testina metallica deve stare sopra tutto

      if (this.body) {
         this.body.setBounce(0.2);
         // Dimensioni temporanee per la "spina" metallica
         this.body.setSize(20, 20); // Un po' più grande per collisioni migliori
         this.body.setDrag(20);
         this.body.setCollideWorldBounds(true);
      }

      this.createSparkEmitter();
      this.drop(); // Inizializza subito lo stato di caduta libera
   }

   private createSparkEmitter() {
      // Creiamo una piccola texture bianca per le scintille se non esiste già
      if (!this.scene.textures.exists('spark_pixel')) {
         const graphics = this.scene.make.graphics({ x: 0, y: 0 }, false);
         graphics.fillStyle(0xffffff, 1);
         graphics.fillRect(0, 0, 2, 2);
         graphics.generateTexture('spark_pixel', 2, 2);
         graphics.destroy(); // Pulizia
      }

      this.sparkEmitter = this.scene.add.particles(0, 0, 'spark_pixel', {
         speed: { min: 50, max: 150 },
         scale: { start: 1, end: 0 },
         lifespan: 300,
         gravityY: 100,
         blendMode: 'ADD',
         emitting: false, // Inizialmente spento
         tint: [0xffff00, 0xffaa00, 0x00ffff], // Scintille gialle, arancio, azzurre
      });
      this.sparkEmitter.setDepth(this.depth + 1);
   }

   setModel<T extends CableModel>(model: Partial<T>) {
      this.model = {
         ...this.model,
         ...model,
      };
   }

   // Da usare chiamandolo esternamente se la Macchina si muove
   public updateAnchorPosition(x: number, y: number) {
      this.currentAnchorX = x + this.model.anchorOffsetX;
      this.currentAnchorY = y + this.model.anchorOffsetY;
   }

   public hold() {
      this.setModel({ status: 'held' });
      // Quando lo prendiamo, puntiamo a una lunghezza estesa
      this.model.targetMaxLength = 800;

      if (this.body) {
         this.body.setVelocity(0, 0);
         this.body.setAllowGravity(false);
      }
   }

   public drop() {
      this.lastDropTime = this.scene.time.now;
      this.setModel({ status: 'idle' });
      // Puntiamo a ripristinare la lunghezza originale in modo fluido
      this.model.targetMaxLength = this.model.baseMaxLength || 200;

      if (this.body) {
         this.body.enable = true; // Riattiva la fisica
         this.body.setAllowGravity(true);
         this.body.setGravityY(500); // Pesante
         this.body.setDrag(150, 60); // Più drag per frenare più in fretta
         this.body.setBounce(0.1); // Rimbalzo fisico minimo
      }
      this.setRotation(0);
   }

   public canBeHeld(): boolean {
      // Cooldown di 500ms per evitare catture istantanee dopo il drop
      return this.scene.time.now - this.lastDropTime > 500;
   }

   public connect() {
      this.setModel({ status: 'connected' });
      // Quando connesso, permettiamo alla fune di estendersi quanto basta per girare ostacoli
      const connLength = this.model.connectedMaxLength || 550;
      this.model.maxLength = connLength;
      this.model.targetMaxLength = connLength;

      if (this.body) {
         this.body.setVelocity(0, 0);
         this.body.setImmovable(true);
         this.body.setAllowGravity(false);
         this.body.setAcceleration(0, 0);
         this.body.enable = false; // Disattiva collisioni mentre è connesso
      }
   }

   public disconnect() {
      // Riportiamo allo stato di caduta libera/idle
      this.drop();
   }

   override preUpdate(time: number, delta: number) {
      super.preUpdate(time, delta);

      // Animazione fluida della lunghezza del cavo (Lerp della maxLength)
      if (this.model.targetMaxLength !== undefined && this.model.maxLength !== this.model.targetMaxLength) {
         if (this.model.status !== 'held') {
            // Quando viene mollato, vogliamo un ripristino immediato o rapidissimo
            // della corda elastica, senza lentezze che creano "U" giganti
            this.model.maxLength = Phaser.Math.Interpolation.Linear([this.model.maxLength, this.model.targetMaxLength], 0.4);
         } else {
            // Quando in mano, si allunga dolcemente
            this.model.maxLength = Phaser.Math.Interpolation.Linear([this.model.maxLength, this.model.targetMaxLength], 0.2);
         }

         // Se molto vicino al target, settiamo direttamente
         if (Math.abs(this.model.maxLength - this.model.targetMaxLength) < 2) {
            this.model.maxLength = this.model.targetMaxLength;
         }
      }

      this.timeTick += delta * 0.005;

      // Gestione Timer Impulsi Elettrici
      if (this.model.status !== 'connected') {
         if (!this.isImpulsing) {
            if (time > this.nextImpulseTime) {
               this.isImpulsing = true;
               this.impulseDurationCounter = this.model.impulseDuration || 600;
               if (this.sparkEmitter) this.sparkEmitter.start();
            }
         } else {
            this.impulseDurationCounter -= delta;
            if (this.impulseDurationCounter <= 0) {
               this.isImpulsing = false;
               const interval = this.model.impulseInterval || { min: 3000, max: 6000 };
               this.nextImpulseTime = time + Phaser.Math.Between(interval.min, interval.max);
               if (this.sparkEmitter) this.sparkEmitter.stop();
               if (this.body) {
                  this.body.setAcceleration(0, 0);
                  // Diamo un colpetto verso il basso alla fine per farlo ricadere
                  this.body.setVelocityY(20);
               }
            }
         }
      } else {
         // Se è connesso, niente scintille o movimenti pazzi (per ora)
         if (this.isImpulsing) {
            this.isImpulsing = false;
            if (this.sparkEmitter) this.sparkEmitter.stop();
         }
      }

      if (this.isImpulsing) {
         this.applyChaosMovement();
         if (this.sparkEmitter) {
            this.sparkEmitter.setPosition(this.x, this.y);
         }
      }

      // La constraint fisica la lasciamo agire solo se non è né impugnato né connesso.
      // Quando è connesso, la posizione è gestita dalla macchina e non deve subire il "tiro" dell'ancora.
      if (this.model.status !== 'held' && this.model.status !== 'connected') {
         this.applyConstraint();
      }
      this.drawWire();
   }

   // Logica della "Scossa Elettrica" (vibrante con sobbalzi)
   private applyChaosMovement() {
      if (!this.body) return;

      // Parametri parametrizzabili
      const frequency = this.model.shockFrequency || 60;
      const intensity = this.model.shockIntensity || 4.0;

      const jitterX = Math.cos(this.timeTick * frequency) * 150 * intensity;
      const jitterY = Math.sin(this.timeTick * frequency * 1.2) * 150 * intensity;

      // Sobbalzo (KICK) periodico alla velocità per un colpo secco
      if (Math.floor(this.timeTick * 100) % 15 === 0) {
         // Colpo secco alla velocità invece di accelerazione graduale
         const vx = (Math.random() - 0.5) * 250;
         const vy = -Math.random() * 200;
         this.body.setVelocity(this.body.velocity.x + vx, this.body.velocity.y + vy);
      }

      this.body.setAcceleration(jitterX, jitterY);
   }

   // Vincolo tipo Molla (Rubber Effect)
   public applyConstraint() {
      if (!this.body) return;

      const dx = this.x - this.currentAnchorX;
      const dy = this.y - this.currentAnchorY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxLength = this.model.maxLength;

      // Se superiamo la lunghezza, applichiamo rimbalzo e forza elastica
      if (dist > maxLength) {
         const angle = Math.atan2(dy, dx);
         const nx = dx / dist; // Normale (direzione dall'ancora al magnete)
         const ny = dy / dist;

         // 1. RIMBALZINO (Riflessione velocità)
         // Calcoliamo la proiezione della velocità sulla normale
         const dot = this.body.velocity.x * nx + this.body.velocity.y * ny;

         if (dot > 0) {
            // Si sta allontanando: riflettiamo la velocità (con un fattore di rimbalzo)
            const bounceFactor = 0.5;
            this.body.velocity.x -= (1 + bounceFactor) * dot * nx;
            this.body.velocity.y -= (1 + bounceFactor) * dot * ny;

            // Posizionamento correttivo per evitare di restare bloccati fuori
            this.x = this.currentAnchorX + nx * maxLength;
            this.y = this.currentAnchorY + ny * maxLength;
         }

         // 2. Forza elastica (gomma) per stabilizzare
         const stretch = dist - maxLength;
         const stiffness = 0.08;
         this.body.setAcceleration(nx * stretch * stiffness * -500, ny * stretch * stiffness * -500);

         // Limite fisico massimo ("Hard wall")
         const hardLimit = maxLength * 1.2;
         if (dist > hardLimit) {
            this.x = this.currentAnchorX + nx * hardLimit;
            this.y = this.currentAnchorY + ny * hardLimit;
         }
      } else {
         // Se siamo dentro il raggio, fermiamo l'accelerazione elastica
         if (!this.isImpulsing) {
            this.body.setAcceleration(0, 0);
         }
      }

      // Smorzamento differenziato per non rallentare troppo la caduta (gravità)
      this.body.velocity.x *= 0.97; // Un po' più di attrito orizzontale
      this.body.velocity.y *= 0.995; // Quasi zero attrito verticale per caduta libera naturale
   }

   public getColorHex(): number {
      let colorHex = 0xff0000;
      switch (this.model.color) {
         case 'blue':
            colorHex = 0x0088ff;
            break;
         case 'green':
            colorHex = 0x00ff00;
            break;
         case 'yellow':
            colorHex = 0xffff00;
            break;
         case 'red':
            colorHex = 0xff0000;
            break;
         default:
            // Supporta anche colori esadecimali diretti da Tiled (es: #00ff00)
            if (this.model.color && (this.model.color as string).startsWith('#')) {
               colorHex = Phaser.Display.Color.HexStringToColor(this.model.color).color;
            }
            break;
      }
      return colorHex;
   }

   public drawWire() {
      if (!this.wireGraphic) return;
      this.wireGraphic.clear();

      const colorHex = this.getColorHex();
      this.setTint(colorHex);

      const dx = this.x - this.currentAnchorX;
      const dy = this.y - this.currentAnchorY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxLength = this.model.maxLength;

      // --- LOGICA CURVA (Bezier) ---
      const points: Phaser.Math.Vector2[] = [];
      if (dist < maxLength && this.model.status !== 'held') {
         const slack = (maxLength - dist) * 0.6;
         const midX = (this.currentAnchorX + this.x) / 2;
         const midY = (this.currentAnchorY + this.y) / 2 + slack;

         for (let i = 0; i <= 10; i++) {
            const t = i / 10;
            const posX = Math.pow(1 - t, 2) * this.currentAnchorX + 2 * (1 - t) * t * midX + Math.pow(t, 2) * this.x;
            const posY = Math.pow(1 - t, 2) * this.currentAnchorY + 2 * (1 - t) * t * midY + Math.pow(t, 2) * this.y;
            points.push(new Phaser.Math.Vector2(posX, posY));
         }
      } else {
         points.push(new Phaser.Math.Vector2(this.currentAnchorX, this.currentAnchorY));
         points.push(new Phaser.Math.Vector2(this.x, this.y));
      }

      // --- DISEGNO MULTI-STRATO (NEON GLOW) ---
      
      // 1. OUTER GLOW (Bagliore esterno largo e soffuso)
      this.wireGraphic.lineStyle(10, colorHex, 0.3);
      this.drawPath(points);

      // 2. MAIN CORE (Il colore pieno del cavo)
      this.wireGraphic.lineStyle(3, colorHex, 1);
      this.drawPath(points);

      // 3. HOT SPOT (Linea centrale chiara per effetto luce)
      this.wireGraphic.lineStyle(1, 0xffffff, 0.5);
      this.drawPath(points);
   }

   private drawPath(points: Phaser.Math.Vector2[]) {
      this.wireGraphic.beginPath();
      this.wireGraphic.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
         this.wireGraphic.lineTo(points[i].x, points[i].y);
      }
      this.wireGraphic.strokePath();
   }

   public override destroy(fromScene?: boolean) {
      if (this.wireGraphic) {
         this.wireGraphic.destroy();
      }
      super.destroy(fromScene);
   }
}
