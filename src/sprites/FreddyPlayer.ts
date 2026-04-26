import { Scene } from 'phaser';
import { PlayerSprite, PlayerModel, Status } from './Player';
import { EntityModel } from '../models/Entity';
import { MagnetGunEntity } from '../entities/MagnetGunEntity';

export interface FreddyModel extends PlayerModel {
   heldCableId: string | null;
}

export class FreddyPlayerSprite extends PlayerSprite {
   declare model: FreddyModel;
   public armSprite: Phaser.GameObjects.Rectangle | null = null;
   public magnetGun: MagnetGunEntity | null = null;
   public heldCable: any | null = null; // CableSprite reference
   public customDefaultVel: number = 200; // Un pó più veloce/reattivo di un top-down standard

   constructor(scene: Scene, props: EntityModel) {
      super(scene, props);
      this.model = {
         ...this.model,
         heldCableId: null,
      } as FreddyModel;

      // Settings ottimizzati per questo Platformer 2D
      this.model.enablePointerShadow = false;
      this.model.hasWeapon = true; // Nel concept freddy impugna sempre/quasi la magnet gun
   }

   override setPlayerBody(animationcompleteCallback?: (animation: string) => void): void {
      super.setPlayerBody(animationcompleteCallback);

      if (this.body) {
         // Setting fisico da Platformer 2D
         this.body.setGravityY(800);
         // Dimensioni temporanee: 24x32
         this.body.setSize(24, 32);
         // this.body.setOffset(4, 0);
      }
      // Setup del braccio separato (Rettangolo invece che Sprite)
      // Larghezza 18 (più corto e proporzionato), altezza 4
      this.armSprite = this.scene.add.rectangle(this.x, this.y, 18, 4, 0x2864c8);
      this.armSprite.setStrokeStyle(1, 0x000000); // Bordo nero per visibilità

      // Impostiamo l'ancoraggio sull'articolazione della spalla
      this.armSprite.setOrigin(0.0, 0.5);
      // Lo mettiamo visivamente davanti al corpo ma dietro l'arma
      this.armSprite.setDepth(this.depth + 1);
      this.armSprite.setPipeline('Light2D'); // Cruciale per vederlo con le luci attive
      this.armSprite.setVisible(true); // Reso visibile

      // Sincronizzazione post-fisica per evitare il lag di 1 frame
      this.scene.events.on('postupdate', this.updateArmAndWeapon, this);
   }

   // Equipaggia la magnet gun
   public equipWeapon(weapon: MagnetGunEntity) {
      this.magnetGun = weapon;
      this.model.hasWeapon = true;
      this.magnetGun.setModel({ status: 'active' });
   }

   override checkCursorsByCurrentGameType(time: number, status: Status) {
      if (!this.body) return; // FIX: Sicurezza contro body distrutt o inesistente
      
      // Ignoriamo la logica base TopDown/2D di "Player.ts" perché noi tracciamo il mouse per il flip
      this.body.setVelocityX(0);

      let isMoving = false;

      // 1. Movimento laterale
      if (this.cursors.left.isDown || this.cursors.a.isDown) {
         this.body.setVelocityX(-this.customDefaultVel);
         isMoving = true;
      } else if (this.cursors.right.isDown || this.cursors.d.isDown) {
         this.body.setVelocityX(this.customDefaultVel);
         isMoving = true;
      }

      // 2. Salto (solo se tocca terra)
      if ((this.cursors.up.isDown || this.cursors.w.isDown || this.cursors.space.isDown) && this.body.blocked.down) {
         this.body.setVelocityY(-550); // Jump Force potenziata
      }

      // Status base per le animazioni del corpo
      this.setModel({ status: isMoving ? 'run' : 'idle' });

      // 3. Orientamento grafico calcolato DOVE si trova il puntatore del mouse, non dalla corsa!
      this.updateFacingToMouse();
   }

   private updateFacingToMouse() {
      const pointer = this.scene.input.activePointer;
      if (!pointer) return;

      const pointerWorldX = pointer.worldX;

      if (pointerWorldX < this.x) {
         // Guarda a sinistra
         this.setFlipX(true);
         this.model.facingX = -1;
      } else {
         // Guarda a destra
         this.setFlipX(false);
         this.model.facingX = 1;
      }
   }

   private updateArmAndWeapon() {
      if (this.model.status === 'dead' || this.model.status === 'crushed') {
         if (this.armSprite) this.armSprite.setVisible(false);
         if (this.magnetGun) {
            this.magnetGun.setModel({ status: this.model.status as any });
            this.magnetGun.setWeaponVisible(false);
            this.magnetGun.clearTether();
         }
         return;
      }

      const pointer = this.scene.input.activePointer;
      if (!pointer) return;

      // Prendiamo il punto nel mondo tenendo conto della camera (per gestire zoom/offset)
      const camera = this.scene.cameras.main;
      const worldPoint = camera.getWorldPoint(pointer.x, pointer.y);

      // Sincronizza braccio
      if (this.armSprite && this.armSprite.active) {
         this.armSprite.setPosition(this.x, this.y);
         const angleRad = Phaser.Math.Angle.Between(this.x, this.y, worldPoint.x, worldPoint.y);
         this.armSprite.setRotation(angleRad);
      }

      // Sincronizza Arma Calamita
      if (this.magnetGun) {
         this.magnetGun.updateAim(this.x, this.y, worldPoint.x, worldPoint.y);
      }

      // Sincronizza Cavo Trasportato
      if (this.heldCable && this.magnetGun) {
         // Calcoliamo la posizione della punta della pistola
         const gun = this.magnetGun as any;
         const angleRad = Phaser.Math.Angle.Between(this.x, this.y, worldPoint.x, worldPoint.y);
         // Lunghezza totale = Braccio (18px) + Canna Pistola (26px)
         const totalGunLength = 44;
         const tipX = this.x + Math.cos(angleRad) * totalGunLength;
         const tipY = this.y + Math.sin(angleRad) * totalGunLength;

         const dist = Phaser.Math.Distance.Between(this.heldCable.x, this.heldCable.y, tipX, tipY);
         const maxLen = gun.model.maxTetherLength || 350;

         // 1. Sgancio di sicurezza se troppo lontano
         if (dist > maxLen) {
            this.dropCable();
            return;
         }

         // 2. Disegno del raggio laser (sincronizzato con il colore del cavo)
         gun.drawTether(this.heldCable.x, this.heldCable.y, this.heldCable.getColorHex());

         // 3. Logica di trascinamento elastico
         if (dist > 5) {
            // Il cavo vola verso la pistola con un lerp (fase traente)
            const lerpFactor = 0.3;
            const nextX = Phaser.Math.Interpolation.Linear([this.heldCable.x, tipX], lerpFactor);
            const nextY = Phaser.Math.Interpolation.Linear([this.heldCable.y, tipY], lerpFactor);
            this.heldCable.setPosition(nextX, nextY);

            // Forza l'applicazione del vincolo fisico (lunghezza cavo dal muro)
            this.heldCable.applyConstraint();
         } else {
            // Incollato alla punta
            this.heldCable.setPosition(tipX, tipY);
         }

         // Sincronizzazione visiva immediata della fune (per evitare lag visivo)
         this.heldCable.drawWire();
      }
   }

   override update(time: number, tileProperties?: any): void {
      this.model.updateTime = time;

      if (this.model.status !== 'dead' && this.model.status !== 'crushed') {
         // check base
         this.checkPlayerSpeedByTileProperty(tileProperties);
         this.setPlayerVelocityByLevelPenalties();

         // Logica Platform + AimMouse
         this.checkCursorsByCurrentGameType(time, this.getPlayerStatus());
         // updateArmAndWeapon() rimosso da qui e spostato in postupdate listener per precisione cinematica

         // Azioni speciali
         this.checkPlayerFire(time);
         this.checkPlayerHasBeenHit(time);

         if (this.model.enableDash) {
            this.checkHandleDash(time);
         }
      } else {
         // LOGICA DI MORTE (DEAD o CRUSHED)
         if (this.body) {
            this.body.setVelocityX(0); // Smettiamo di correre, ma cadiamo per gravità (se non schiacciati)
         }
         
         if (this.heldCable) {
            this.dropCable();
         }
      }
   }

   override checkPlayerFire(time: number) {
      this.setModel({ canShoot: false });

      const scene = this.scene as any;
      // Lo sparo è l'unica cosa "attiva" che lasciamo al player,
      // a meno che non sia gestito dal livello (come ora)
      const wantsToShoot = scene.lastMouseButton === 'left';

      if (this.model.hasWeapon && !this.heldCable && wantsToShoot) {
         if (time > this.model.shootTimer) {
            this.setModel({
               status: 'fire',
               canShoot: true,
               shootTimer: time + this.model.shootDelay,
            });
         }
      }

      // DROP CABLE (Solo tastiera F - Il mouse è gestito centralmente in SceneUtils)
      if (Phaser.Input.Keyboard.JustDown(this.scene.input.keyboard!.addKey('F'))) {
         this.dropCable();
      }
   }

   public holdCable(cable: any) {
      this.heldCable = cable;
      this.model.heldCableId = cable.model.id;
   }

   public dropCable() {
      if (this.heldCable) {
         // Se il cavo è già stato connesso a una macchina, non resettiamo a 'idle'
         if (this.heldCable.model.status !== 'connected') {
            this.heldCable.drop();
         }
         this.heldCable = null;
         this.model.heldCableId = null;
      }
   }

   override destroy(fromScene?: boolean): void {
      if (this.scene && this.scene.events) {
         this.scene.events.off('postupdate', this.updateArmAndWeapon, this);
      }
      if (this.armSprite) {
         this.armSprite.destroy();
      }
      if (this.magnetGun) {
         this.magnetGun.destroyWeapon(); // pulizia base
      }
      super.destroy(fromScene);
   }
}
