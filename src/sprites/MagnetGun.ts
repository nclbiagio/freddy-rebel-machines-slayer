import { Scene } from 'phaser';
import { WeaponModel, WeaponSprite } from './Weapon';
import { EntityModel } from '../models/Entity';
import { PLAYER_DEPTH } from './Player';
import { GameService } from '../GameService';
import { MagnetProjectile } from '../entities/MagnetProjectile';
import { BulletSprite } from './Bullet';

export interface MagnetGunModel extends WeaponModel {
   magnetStrength: number;
   magnetRange: number;
   maxTetherLength: number;
}

export class MagnetGunSprite extends WeaponSprite {
   declare model: MagnetGunModel;
   private debugLine?: Phaser.GameObjects.Graphics;
   private sightGraphics?: Phaser.GameObjects.Graphics;
   private tetherGraphics?: Phaser.GameObjects.Graphics;
   private collisionLayer?: Phaser.Tilemaps.TilemapLayer;
   private currentProjectile: MagnetProjectile | null = null;

   constructor(scene: Scene, props: EntityModel) {
      super(scene, props);

      this.model = {
         ...this.model,
         magnetStrength: 500,
         magnetRange: 300,
         maxTetherLength: 350,
         hasBullets: true,
         type: 'magnet',
      };

      // Essenziale per le armi a 360: spostare l'origine sulla base dell'arma (impugnatura)
      // così che ruoti con un raggio naturale invece che sul centro
      this.setOrigin(0.2, 0.5);
   }

   // Sovrascriviamo l'update standard che si basava sulle 4 direzioni cardinali
   // per applicare un puntamento totale 360 verso il mouse (pointer)
   public updateAim(playerX: number, playerY: number, mouseX: number, mouseY: number) {
      if (this.model.status === 'dead') {
         this.setWeaponVisible(false);
         this.destroyWeapon();
         return;
      }

      if (this.model.status === 'active' || this.model.status === 'fire') {
         // L'arma viene posta poco sopra il braccio e il corpo
         this.setDepth(PLAYER_DEPTH + 2);

         // Calcolo dell'angolo (in radianti) rispetto al puntatore
         const angleRad = Phaser.Math.Angle.Between(playerX, playerY, mouseX, mouseY);

         // Spostiamo il punto di attacco dell'arma alla fine del braccio (18 pixel di lunghezza)
         const handX = playerX + Math.cos(angleRad) * 18;
         const handY = playerY + Math.sin(angleRad) * 18;

         this.setPosition(handX, handY);

         // Ruotiamo la visuale dell'arma a 360 gradi fluidi
         this.setRotation(angleRad);

         // Evitiamo che l'arma risulti sottosopra passando il puntatore da destra a sinistra
         if (mouseX < this.x) {
            this.setFlipY(true);
         } else {
            this.setFlipY(false);
         }

         // --- PERMANENT SIGHT (MIRINO) ---
         if (!this.sightGraphics) {
            this.sightGraphics = this.scene.add.graphics();
            this.sightGraphics.setDepth(PLAYER_DEPTH + 100); // Super top
         }
         this.sightGraphics.clear();

         // Draw a nice "Premium" reticle
         const time = this.scene.time.now;
         const pulse = Math.sin(time / 200) * 2; // Subtle pulse effect
         
         // Outer ring (pulsing)
         this.sightGraphics.lineStyle(1.5, 0x00ff88, 0.6);
         this.sightGraphics.strokeCircle(mouseX, mouseY, 8 + pulse);
         
         // Inner Dot
         this.sightGraphics.fillStyle(0x00ff88, 1);
         this.sightGraphics.fillCircle(mouseX, mouseY, 2);
         
         // Crosshair Lines (top, bottom, left, right)
         this.sightGraphics.lineStyle(1, 0xffffff, 0.8);
         const lineLen = 4;
         const offset = 4;
         // Horizontal
         this.sightGraphics.lineBetween(mouseX - offset - lineLen, mouseY, mouseX - offset, mouseY);
         this.sightGraphics.lineBetween(mouseX + offset, mouseY, mouseX + offset + lineLen, mouseY);
         // Vertical
         this.sightGraphics.lineBetween(mouseX, mouseY - offset - lineLen, mouseX, mouseY - offset);
         this.sightGraphics.lineBetween(mouseX, mouseY + offset, mouseX, mouseY + offset + lineLen);

         // --- DEBUG INFO (Only if debug is ON) ---
         const gameService = GameService.getInstance();
         if (gameService.debug) {
            if (!this.debugLine) {
               this.debugLine = this.scene.add.graphics();
               this.debugLine.setDepth(PLAYER_DEPTH + 10);
            }
            this.debugLine.clear();

            // Red line from barrel tip to mouse
            const barrelLength = 26;
            const tipX = this.x + Math.cos(angleRad) * barrelLength;
            const tipY = this.y + Math.sin(angleRad) * barrelLength;

            this.debugLine.lineStyle(1, 0xff0000, 0.4); // Subtle red line
            this.debugLine.beginPath();
            this.debugLine.moveTo(tipX, tipY);
            this.debugLine.lineTo(mouseX, mouseY);
            this.debugLine.strokePath();

            // Yellow pivot point
            this.debugLine.fillStyle(0xffff00, 1);
            this.debugLine.fillCircle(this.x, this.y, 2);
         } else if (this.debugLine) {
            this.debugLine.clear();
         }

         // --- VISUAL TETHER (ROPE) ---
         if (this.currentProjectile && this.currentProjectile.active) {
            this.drawTether(this.currentProjectile.x, this.currentProjectile.y);
         } else {
            this.clearTether();
         }
      }
   }

   public setCollisionLayer(layer: Phaser.Tilemaps.TilemapLayer) {
      this.collisionLayer = layer;
   }

   public override fireBullet(bullets: Phaser.GameObjects.Group) {
      // Unico colpo alla volta: se c'è un proiettile attivo, non spariamo
      if (this.currentProjectile && this.currentProjectile.active) {
         return;
      }

      if (this.model.hasBullets) {
         // Calcoliamo la punta della canna per far uscire il colpo da lì
         const barrelLength = 26;
         const tipX = this.x + Math.cos(this.rotation) * barrelLength;
         const tipY = this.y + Math.sin(this.rotation) * barrelLength;

         // --- WALL OBSTRUCTION CHECK ---
         if (this.collisionLayer) {
            const tile = this.collisionLayer.getTileAtWorldXY(tipX, tipY);
            if (tile && tile.collides) {
               // Se la punta è dentro un muro, non spariamo
               return;
            }
         }

         const bulletFromGroup = bullets.getFirstDead();
         if (bulletFromGroup) {
            const magnet = bulletFromGroup as MagnetProjectile;
            this.currentProjectile = magnet;

            magnet.fireAtAngle(tipX, tipY, this.rotation, this, this.model.magnetRange);
         }
      }
   }

   public clearActiveProjectile() {
      this.currentProjectile = null;
      this.clearTether();
   }

   public drawTether(targetX: number, targetY: number, color: number = 0x0088ff) {
      if (!this.tetherGraphics) {
         this.tetherGraphics = this.scene.add.graphics();
         this.tetherGraphics.setDepth(this.depth - 1);
      }

      this.tetherGraphics.clear();

      // Punto di origine sulla punta della canna
      const barrelLength = 26;
      const tipX = this.x + Math.cos(this.rotation) * barrelLength;
      const tipY = this.y + Math.sin(this.rotation) * barrelLength;

      // Disegno del raggio laser traente
      // Aura esterna dinamica (default blu)
      this.tetherGraphics.lineStyle(4, color, 0.4);
      this.tetherGraphics.beginPath();
      this.tetherGraphics.moveTo(tipX, tipY);
      this.tetherGraphics.lineTo(targetX, targetY);
      this.tetherGraphics.strokePath();

      // Nucleo interno bianco
      this.tetherGraphics.lineStyle(1.5, 0xffffff, 0.8);
      this.tetherGraphics.beginPath();
      this.tetherGraphics.moveTo(tipX, tipY);
      this.tetherGraphics.lineTo(targetX, targetY);
      this.tetherGraphics.strokePath();
   }

   public clearTether() {
      if (this.tetherGraphics) {
         this.tetherGraphics.clear();
      }
   }

   override destroyWeapon() {
      if (this.debugLine) {
         this.debugLine.destroy();
      }
      if (this.sightGraphics) {
         this.sightGraphics.destroy();
      }
      if (this.tetherGraphics) {
         this.tetherGraphics.destroy();
      }
      super.destroyWeapon();
   }
}
