import { RebelMachineSprite, RebelMachineModel } from '../sprites/RebelMachine';
import { Scene } from 'phaser';
import { EntityModel } from '../models/Entity';
import { MessageUtils } from '../message/Message';

export class MainframeEntity extends RebelMachineSprite {
   static key = 'machine_mainframe';
   private slimeGraphics: Phaser.GameObjects.Graphics | null = null;
   public acidDrops: Phaser.Physics.Arcade.Group | null = null;
   private sprayTimer: number = 0;
   private sprayInterval: number = 80; // Pioggia intensa (ogni 80ms)
   private initialX: number = 0;
   private initialY: number = 0;

   constructor(scene: Scene, props: EntityModel) {
      // 2 Socket posizionati vicino al pannello drive (coordinate riferite a 128x128)
      const socketsConfig = [
         { x: 80, y: 95, id: 1 },
         { x: 104, y: 95, id: 2 },
      ];
      super(scene, props, socketsConfig);

      this.initialX = props.x;
      this.initialY = props.y;

      this.setDepth(10);
      if (this.body) {
         this.body.setSize(108, 100);
         this.body.setOffset(10, 20);
         this.body.setImmovable(true);
         this.body.setAllowGravity(false); // Sospeso al soffitto
      }

      // Inizializziamo il gruppo per l'acido
      this.acidDrops = this.scene.physics.add.group();

      // Creiamo la texture per la goccia d'acido se non esiste
      if (!this.scene.textures.exists('acid_drop')) {
         const graphics = this.scene.add.graphics();
         graphics.fillStyle(0x00ff00, 1);
         graphics.fillCircle(4, 4, 4);
         graphics.generateTexture('acid_drop', 8, 8);
         graphics.destroy();
      }
   }

   static create(scene: Scene, props: { x: number; y: number }, model?: Partial<RebelMachineModel>): MainframeEntity {
      const entity = new MainframeEntity(scene, { id: self.crypto.randomUUID(), key: MainframeEntity.key, ...props });
      if (model) {
         entity.setModel(model);
      }
      return entity;
   }

   static loadSpritesheet(scene: Scene) {
      scene.load.image(MainframeEntity.key, `spritesheet/${MainframeEntity.key}.png`);
   }

   override update() {
      super.update();

      if (this.model.isSolved) {
         this.setAlpha(1);
         this.clearTint();
         if (this.slimeGraphics) this.slimeGraphics.clear();
         if (this.acidDrops) this.acidDrops.clear(true, true);
         return;
      }

      // --- LOGICA RIBELLIONE LIVELLO 2 ---
      if (this.model.isRebellious) {
         this.applyAcidPattern();
         this.drawSlimeArms();
      } else {
         // Comportamento Standard: Glitch Elettronico
         if (Math.random() > 0.95) {
            const glitchX = (Math.random() - 0.5) * 4;
            this.setX(this.x + glitchX);
            this.setAlpha(0.7 + Math.random() * 0.3);

            this.scene.time.delayedCall(32, () => {
               if (this.active) {
                  this.setX(this.x - glitchX);
                  this.setAlpha(1);
               }
            });
         }
      }
   }

   private applyAcidPattern() {
      const now = this.scene.time.now;

      // Inizializzazione stato
      if (!this.model.rebellionState) {
         this.model.rebellionState = 'moving'; // Dondolio
         this.model.nextStateChange = now + 4000;
         this.model.chaosSpeed = 150; // Velocità spruzzo
      }

      // Transizioni
      if (now > (this.model.nextStateChange || 0)) {
         if (this.model.rebellionState === 'moving') {
            this.model.rebellionState = 'sparking'; // Attacco Acido
            this.model.nextStateChange = now + 3000; // 3s di attacco
         } else if (this.model.rebellionState === 'sparking') {
            this.model.rebellionState = 'tired'; // Pausa sicura
            this.model.nextStateChange = now + 5000; // Aumentato a 5s
         } else {
            this.model.rebellionState = 'moving'; // Dondolio innocuo
            this.model.nextStateChange = now + 7000; // Aumentato a 7s
         }
      }

      // Comportamenti
      if (this.model.rebellionState === 'moving') {
         this.setTint(0xff0000);
         // Risalita verso posizione iniziale
         if (this.y > this.initialY) {
            this.y -= 2;
         }
         // Dondolio sinuoso
         this.x += Math.sin(now / 500) * 1.5;
      } else if (this.model.rebellionState === 'sparking') {
         this.setTint(0x00ff00);
         this.scene.cameras.main.shake(100, 0.002);

         // Risalita (sicurezza)
         if (this.y > this.initialY) {
            this.y -= 1;
         }

         // Spruzzo ritmato invece che ogni frame
         if (now > this.sprayTimer) {
            this.fireAcid();
            this.sprayTimer = now + this.sprayInterval;
         }

         // Vibrazione violenta
         this.x += (Math.random() - 0.5) * 4;
         this.y += (Math.random() - 0.5) * 2;
      } else if (this.model.rebellionState === 'tired') {
         this.setTint(0xaaaaaa);
         // Torna al centro X
         this.x += (this.initialX - this.x) * 0.05;

         // Discesa verso il basso (Vulnerabile)
         // Scende di circa 280 pixel o finché non tocca (fittizio, usiamo un limite sicuro)
         if (this.y < this.initialY + 200) {
            this.y += 3;
         }
      }
   }

   private fireAcid() {
      if (!this.acidDrops) return;

      // Spara 2 gocce alla volta per saturare lo spazio
      for (let i = 0; i < 2; i++) {
         const drop = this.acidDrops.create(this.x + (Math.random() - 0.5) * 40, this.y + 20, 'acid_drop');
         if (drop && drop.body) {
            // Velocità molto più ampia e caotica "scagliare ovunque"
            const vx = (Math.random() - 0.5) * 800; // Da 400 a 800
            const vy = -Math.random() * 400; // Da 200 a 400
            (drop.body as Phaser.Physics.Arcade.Body).setVelocity(vx, vy);
            (drop.body as Phaser.Physics.Arcade.Body).setGravityY(500);
            (drop.body as Phaser.Physics.Arcade.Body).setBounce(0.5);
            (drop.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);
            
            // Auto-distruzione dopo 3 secondi
            this.scene.time.delayedCall(3000, () => {
               if (drop.active) drop.destroy();
            });
         }
      }
   }

   private drawSlimeArms() {
      if (!this.slimeGraphics) {
         this.slimeGraphics = this.scene.add.graphics();
         this.slimeGraphics.setDepth(5);
      }

      this.slimeGraphics.clear();
      this.slimeGraphics.lineStyle(8, 0x00ff00, 0.8);

      // L'ancoraggio deve essere FISSO al soffitto, non relativo alla Y corrente
      const anchorY = this.initialY - 120; 
      const anchorXL = this.initialX - 30;
      const anchorXR = this.initialX + 30;

      // Braccio Sinistro
      const startL = new Phaser.Math.Vector2(anchorXL, anchorY);
      const endL = new Phaser.Math.Vector2(this.x - 20, this.y - 40);
      const cpL = new Phaser.Math.Vector2(this.x - 60 + Math.sin(this.scene.time.now / 400) * 20, (anchorY + this.y) / 2);
      const curveL = new Phaser.Curves.QuadraticBezier(startL, cpL, endL);
      curveL.draw(this.slimeGraphics);

      // Braccio Destro
      const startR = new Phaser.Math.Vector2(anchorXR, anchorY);
      const endR = new Phaser.Math.Vector2(this.x + 20, this.y - 40);
      const cpR = new Phaser.Math.Vector2(this.x + 60 + Math.cos(this.scene.time.now / 400) * 20, (anchorY + this.y) / 2);
      const curveR = new Phaser.Curves.QuadraticBezier(startR, cpR, endR);
      curveR.draw(this.slimeGraphics);

      // Piccole gocce statiche vischiose
      this.slimeGraphics.fillStyle(0x00ff00, 0.6);
      this.slimeGraphics.fillCircle(this.initialX - 35, anchorY + 20, 4);
      this.slimeGraphics.fillCircle(this.initialX + 35, anchorY + 15, 5);
   }

   destroy(fromScene?: boolean) {
      if (this.slimeGraphics) this.slimeGraphics.destroy();
      if (this.acidDrops) this.acidDrops.destroy(true);
      super.destroy(fromScene);
   }
}
