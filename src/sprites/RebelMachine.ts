import { Physics, Scene } from 'phaser';
import { EntityModel } from '../models/Entity';
import { MessageUtils } from '../message/Message';
import { EventBus } from '../EventBus';
import { SynthUtils } from '../core/audio/SynthUtils';

export interface RebelMachineModel extends EntityModel {
   activeSequence: Array<{ socketId: number; color: string }>;
   connectedSequence: number[];
   nextExpectedSocket: number;
   chaosLevel: number;
   isPlayerNear: boolean;
   isSolved: boolean;
   hasRevealedSequence?: boolean;

   // Nuovi parametri per la Ribellione (Pattern: Avanti/Indietro + Scintille + Stanchezza)
   isRebellious?: boolean;
   rebellionState?: 'moving' | 'sparking' | 'tired';
   nextStateChange?: number;
   moveDirection?: number; // 1 o -1
   chaosSpeed?: number;

   // Parametri di configurazione
   flashInterval?: number;
   flashDuration?: number;
   proximityDistance?: number;
}

const ColorMap: Record<string, number> = {
   red: 0xff0000,
   blue: 0x3333ff,
   green: 0x22ff22,
   yellow: 0xffff00,
   cyan: 0x00ffff,
};

export interface SocketInfo {
   x: number;
   y: number;
   id: number;
   connectedCableId: string | null;
   ledColor: number;
   connectedCable: any;
   ledCircle: Phaser.GameObjects.Arc | null;
   glowSprite: Phaser.GameObjects.Image | null;
   glowSpriteSecondary: Phaser.GameObjects.Image | null;
}

export class RebelMachineSprite extends Physics.Arcade.Sprite {
   public model: RebelMachineModel;
   declare body: Physics.Arcade.Body;

   public sockets: SocketInfo[] = [];

   constructor(scene: Scene, props: EntityModel, socketsConfig?: Array<{ x: number; y: number; id: number }>) {
      super(scene, props.x, props.y, props.key);

      this.model = {
         activeSequence: [
            { socketId: 1, color: 'red' },
            { socketId: 2, color: 'blue' },
         ],
         connectedSequence: [],
         nextExpectedSocket: 0,
         chaosLevel: 0,
         isPlayerNear: false,
         isSolved: false,
         flashInterval: 800,
         flashDuration: 600,
         proximityDistance: 120,
         ...props,
      } as RebelMachineModel;

      // Inizializzazione Sockets
      const config = socketsConfig || [
         { x: 32, y: 42, id: 1 },
         { x: 64, y: 42, id: 2 },
         { x: 96, y: 42, id: 3 },
      ];

      this.sockets = config.map((s) => ({
         ...s,
         connectedCableId: null,
         ledColor: 0x444444,
         connectedCable: null,
         ledCircle: null,
         glowSprite: null,
         glowSpriteSecondary: null,
      }));

      // Creazione texture Glow (effetto faro)
      this.#createGlowTexture();

      scene.add.existing(this);
      scene.physics.add.existing(this, false);

      // Essenziale per far girare update() correttamente
      scene.sys.updateList.add(this);

      if (this.body) {
         this.body.setCollideWorldBounds(true);
         this.body.setDragX(500);
      }

      this.setDepth(10);
      this.setPipeline('Light2D');

      // Inizializziamo i LED come GameObjects permanenti
      this.sockets.forEach((socket, i) => {
         const worldPos = this.getSocketWorldPosition(i)!;
         
         // Bagliore primario (Faro)
         const glow = scene.add.image(worldPos.x, worldPos.y - 12, 'led_glow');
         glow.setDepth(this.depth + 1);
         glow.setBlendMode('ADD');
         glow.setAlpha(0);
         glow.setScale(0.5);
         socket.glowSprite = glow;

         // Bagliore secondario (Intensità extra nucleo)
         const glow2 = scene.add.image(worldPos.x, worldPos.y - 12, 'led_glow');
         glow2.setDepth(this.depth + 1);
         glow2.setBlendMode('ADD');
         glow2.setAlpha(0);
         glow2.setScale(0.3);
         socket.glowSpriteSecondary = glow2;

         // Cerchio centrale solido
         const circle = scene.add.circle(worldPos.x, worldPos.y - 12, 6, socket.ledColor);
         circle.setDepth(this.depth + 2);
         circle.setStrokeStyle(2, 0xffffff, 0.3);
         socket.ledCircle = circle;
      });
   }

   #createGlowTexture() {
      if (this.scene.textures.exists('led_glow')) return;

      const size = 64;
      const canvasTexture = this.scene.textures.createCanvas('led_glow', size, size);
      if (canvasTexture) {
         const ctx = canvasTexture.getContext();
         const gradient = ctx.createRadialGradient(size / 2, size / 2, 2, size / 2, size / 2, size / 2);
         gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
         gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.95)'); // Nucleo più denso
         gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.6)'); // Sfumatura più lenta
         gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
         
         ctx.fillStyle = gradient;
         ctx.fillRect(0, 0, size, size);
         canvasTexture.refresh();
      }
   }

   setRebelMachineBody(animationcompleteCallback?: (animation: string) => void) {
      //this.setScale(0.7, 1);
      this.on(
         'animationcomplete',
         (animation: { key: string }) => {
            if (animationcompleteCallback) {
               animationcompleteCallback(animation.key);
            }
         },
         this
      );
      this.body.setImmovable();
   }

   setModel<T extends RebelMachineModel>(model: Partial<T>) {
      this.model = {
         ...this.model,
         ...model,
      };
   }

   // Restituisce la posizione mondo di un socket
   public getSocketWorldPosition(socketIndex: number) {
      const socket = this.sockets[socketIndex];
      if (!socket) return null;

      // Usiamo la matrice di trasformazione del mondo per calcolare la posizione esatta.
      // Le coordinate x,y del socket sono relative all'angolo in alto a sinistra del frame (128x64).
      // Sottraiamo l'origine (centro) per trovare l'offset relativo al centro del gameobject.
      const localX = socket.x - this.width * this.originX;
      const localY = socket.y - this.height * this.originY;

      const matrix = this.getWorldTransformMatrix();
      const worldX = matrix.tx + (localX * matrix.a + localY * matrix.c);
      const worldY = matrix.ty + (localX * matrix.b + localY * matrix.d);

      return { x: worldX, y: worldY };
   }

   public connectCable(socketIndex: number, cable: any) {
      if (this.model.isSolved) return;

      const socket = this.sockets[socketIndex];
      const cableColor = cable.model.color || 'red'; // Default to red if not specified

      if (socket && socket.connectedCableId === null) {
         socket.connectedCableId = cable.model.id;
         socket.connectedCable = cable; // Salva il riferimento per il sync
         (cable as any).connectedToId = this.model.id;
         (cable as any).connectedToSocketId = socket.id;
         
         // Feedback sonoro meccanico
         SynthUtils.playConnectSound(0.2);

         const expectedStep = this.model.activeSequence[this.model.nextExpectedSocket];
         const isCorrectSocket = socket.id === expectedStep.socketId;
         const isCorrectColor = cableColor === expectedStep.color;

         if (isCorrectSocket && isCorrectColor) {
            this.model.nextExpectedSocket++;
            socket.ledColor = 0x00ff00; // Verde: Corretto

            if (this.scene.cache.audio.exists('confirm')) {
               this.scene.sound.play('confirm', { volume: 0.5 });
            }

            if (this.model.nextExpectedSocket >= this.model.activeSequence.length) {
               this.model.isSolved = true;
               this.onSolved();
            }
         } else {
            console.log(`WRONG CONNECTION! Expected ${expectedStep.color} at socket ${expectedStep.socketId}, got ${cableColor} at socket ${socket.id}`);
            socket.ledColor = 0xff0000; // Rosso: Errato

            if (this.scene.cache.audio.exists('error')) {
               this.scene.sound.play('error', { volume: 0.5 });
            }

            // RESET: La macchina espelle tutto dopo 1 sec
            this.scene.time.delayedCall(1000, () => this.resetConnections());
         }

         const worldPos = this.getSocketWorldPosition(socketIndex)!;
         cable.setPosition(worldPos.x, worldPos.y);
         cable.connect();
      }
   }

   public disconnectCable(socketIndex: number) {
      if (this.model.isSolved) return;

      const socket = this.sockets[socketIndex];
      if (socket && socket.connectedCableId) {
         // Cerca il cavo nella scena tramite l'ID
         const cable = this.scene.children.getByName(socket.connectedCableId) as any;
         if (cable && cable.disconnect) {
            cable.disconnect();
         }
         socket.connectedCableId = null;
         socket.connectedCable = null;
         socket.ledColor = 0x444444; // Spento

         // Se avevamo fatto progressi, resettiamo?
         // Dipende se vogliamo che il player possa togliere solo l'ultimo o tutti.
         // Per ora resettiamo la sequenza se toglie un cavo.
         this.model.nextExpectedSocket = 0;
         this.sockets.forEach((s) => (s.ledColor = s.connectedCableId ? 0xffbb00 : 0x444444));
      }
   }

   private resetConnections() {
      if (this.model.isSolved) return;

      this.sockets.forEach((s, i) => {
         if (s.connectedCableId) {
            this.disconnectCable(i);
         }
      });
      this.model.nextExpectedSocket = 0;
   }

   public revealSequence() {
      console.log(`[RebelMachine] revealSequence triggered for machine ${this.model.id}`);
      // Il suono viene riprodotto singolarmente per ogni lampeggio sotto

      let delay = 0;
      this.model.activeSequence.forEach((step, i) => {
         this.scene.time.delayedCall(delay, () => {
            const idx = this.sockets.findIndex((s) => s.id === step.socketId);
            console.log(`[RebelMachine] Flashing step ${i}: socketId ${step.socketId} -> index ${idx}, color ${step.color}`);
            const hexColor = ColorMap[step.color] || 0x00ffff;
            this.flashSocket(idx, hexColor);
            SynthUtils.playCollectSound(0.15); // Suona ad ogni lampeggio
         });
         delay += this.model.flashInterval || 800;
      });
   }
   private flashSocket(index: number, flashColor: number = 0x00ffff) {
      if (index === -1 || !this.sockets[index]) return;

      const socket = this.sockets[index];
      // Lampeggio colore richiesto
      socket.ledColor = flashColor;
      if (socket.ledCircle) {
         socket.ledCircle.setFillStyle(flashColor, 1);
      }

      if (socket.glowSprite) {
         socket.glowSprite.setTint(flashColor);
         socket.glowSprite.setAlpha(0);
         socket.glowSprite.setScale(0.3);
         
         this.scene.tweens.add({
            targets: socket.glowSprite,
            alpha: 1,
            scale: 3.5, // Estremamente dilatato
            duration: 250,
            yoyo: true,
            hold: 200
         });
      }

      if (socket.glowSpriteSecondary) {
         socket.glowSpriteSecondary.setTint(flashColor);
         socket.glowSpriteSecondary.setAlpha(0);
         socket.glowSpriteSecondary.setScale(0.2);
         
         this.scene.tweens.add({
            targets: socket.glowSpriteSecondary,
            alpha: 1,
            scale: 1.5, // Nucleo intenso che pulsa
            duration: 200,
            yoyo: true,
            hold: 250
         });
      }

      this.scene.time.delayedCall(this.model.flashDuration || 600, () => {
         // Torna al colore base (spento se non connesso, arancio se connesso ma non validato)
         if (socket.connectedCableId) {
            const currentStepIdx = this.model.nextExpectedSocket - 1;
            const isSelfCorrect = currentStepIdx >= 0 && this.model.activeSequence[currentStepIdx].socketId === socket.id;
            socket.ledColor = isSelfCorrect ? 0x00ff00 : 0xffbb00;
         } else {
            socket.ledColor = 0x444444;
         }

         if (socket.ledCircle) {
            socket.ledCircle.setFillStyle(socket.ledColor, 1);
         }
         
         if (socket.glowSprite) {
            this.scene.tweens.add({
               targets: socket.glowSprite,
               alpha: socket.ledColor === 0x444444 ? 0 : 0.4,
               scale: 0.7,
               duration: 300
            });
         }

         if (socket.glowSpriteSecondary) {
            this.scene.tweens.add({
               targets: socket.glowSpriteSecondary,
               alpha: socket.ledColor === 0x444444 ? 0 : 0.6,
               scale: 0.4,
               duration: 300
            });
         }
      });
   }

   private drawLEDs() {
      this.sockets.forEach((socket, i) => {
         if (socket.ledCircle) {
            const worldPos = this.getSocketWorldPosition(i)!;
            socket.ledCircle.setPosition(worldPos.x, worldPos.y - 12);
            if (socket.glowSprite) {
               socket.glowSprite.setPosition(worldPos.x, worldPos.y - 12);
               socket.glowSprite.setTint(socket.ledColor);
            }
            if (socket.glowSpriteSecondary) {
               socket.glowSpriteSecondary.setPosition(worldPos.x, worldPos.y - 12);
               socket.glowSpriteSecondary.setTint(socket.ledColor);
            }

            // Sincronizziamo anche il colore (per feedback immediato su connessione)
            socket.ledCircle.setFillStyle(socket.ledColor, 1);

            // Effetto glow visivo: se acceso, aumentiamo un po' la dimensione o aggiungiamo feedback
            if (socket.ledColor !== 0x444444) {
               socket.ledCircle.setRadius(7);
               socket.ledCircle.setAlpha(1);
            } else {
               socket.ledCircle.setRadius(5);
               socket.ledCircle.setAlpha(0.6);
            }
         }
      });
   }

   private onSolved() {
      console.log(`[RebelMachine] Machine ${this.model.id} SOLVED!`);
      this.setTint(0x00ffff); // Glow ciano per indicare successo
      // Emitti l'evento di risoluzione sul bus globale
      EventBus.emit('machine-solved', this.model.id);
   }

   public getNextFreeSocket(): number {
      // In questo gioco l'ordine è importante, ma lasciamo che il player provi a inserire dove vuole
      return this.getNextAvailableSocketIndex();
   }

   public getNextAvailableSocketIndex(): number {
      // Per ora restituiamo il primo vuoto che incontriamo
      return this.sockets.findIndex((s) => s.connectedCableId === null);
   }

   public getClosestSocketIndex(x: number, y: number): number {
      let closestIdx = -1;
      let minDist = Infinity;

      this.sockets.forEach((socket, i) => {
         const worldPos = this.getSocketWorldPosition(i)!;
         const dist = Phaser.Math.Distance.Between(x, y, worldPos.x, worldPos.y);
         if (dist < minDist) {
            minDist = dist;
            closestIdx = i;
         }
      });

      return closestIdx;
   }

   destroy(fromScene?: boolean) {
      if (this.scene && this.scene.sys && this.scene.sys.updateList) {
         this.scene.sys.updateList.remove(this);
      }
      super.destroy(fromScene);
   }

   public checkPlayerProximity(player: { x: number; y: number }, distance?: number) {
      if (this.model.isSolved) return;

      const checkDist = distance || this.model.proximityDistance || 120;
      const isNear = Phaser.Math.Distance.Between(player.x, player.y, this.x, this.y) < checkDist;

      if (isNear !== this.model.isPlayerNear) {
         this.setModel({ isPlayerNear: isNear } as any);
      }
   }

   override update() {
      // Logica di evidenziazione se il player è vicino
      if (this.model.isSolved) {
         this.setTint(0x00ffff);
         if (this.body) {
            this.body.setVelocity(0, 0);
            this.setRotation(0);
         }
      } else if (this.model.isPlayerNear) {
         this.setTint(0x00ff00);
      } else {
         this.clearTint();
      }

      this.drawLEDs();

      // Sincronizza la posizione dei cavi
      this.sockets.forEach((socket, i) => {
         if (socket.connectedCable && socket.connectedCable.scene) {
            const worldPos = this.getSocketWorldPosition(i)!;
            socket.connectedCable.setPosition(worldPos.x, worldPos.y);
         }
      });
   }
}
