import { Scene } from 'phaser';
import { FreddyEntity } from '../entities/FreddyEntity';
import { RebelMachineSprite } from '../sprites/RebelMachine';
import { MessageUtils } from '../message/Message';

export const handleMachineInteractions = (scene: Scene, player: FreddyEntity, machines: Phaser.GameObjects.Group): boolean => {
   const isEJustDown = Phaser.Input.Keyboard.JustDown(scene.input.keyboard!.addKey('E'));
   const isFJustDown = Phaser.Input.Keyboard.JustDown(scene.input.keyboard!.addKey('F'));

   // Detezione click basata sull'ultimo tasto premuto catturato da BaseScene
   let wantsToConnect = isEJustDown || (scene as any).lastMouseButton === 'left';
   let wantsToDrop = isFJustDown || (scene as any).lastMouseButton === 'right';

   // Se troviamo un input valido, lo "consumiamo" resettando lo stato nella scena
   if ((scene as any).lastMouseButton === 'left' || (scene as any).lastMouseButton === 'right') {
      (scene as any).lastMouseButton = null;
   }

   if (wantsToConnect) {
      if (player.heldCable) {
         // MODALITÀ CONNESSIONE (Solo se hai il cavo)
         const cable = player.heldCable;
         let bestMachine: RebelMachineSprite | null = null;
         let bestSocketIdx = -1;
         let minDistance = 50;

         machines.children.entries.forEach((m) => {
            const machine = m as RebelMachineSprite;
            const socketIdx = machine.getClosestSocketIndex(cable.x, cable.y);
            if (socketIdx !== -1) {
               const worldPos = machine.getSocketWorldPosition(socketIdx)!;
               const dist = Phaser.Math.Distance.Between(cable.x, cable.y, worldPos.x, worldPos.y);
               if (dist < minDistance) {
                  minDistance = dist;
                  bestMachine = machine;
                  bestSocketIdx = socketIdx;
               }
            }
         });

         if (bestMachine && bestSocketIdx !== -1) {
            (bestMachine as RebelMachineSprite).connectCable(bestSocketIdx, cable);
            player.dropCable();
            return true;
         }
      }
   }

   if (wantsToDrop) {
      if (player.heldCable) {
         // DROP CABLE (Sempre prioritario se tieni un cavo)
         player.dropCable();
         return true;
      } else {
         // MODALITÀ DISCONNESSIONE (Se vicino a un socket occupato)
         const machine = machines.children.entries.find((m) => (m as RebelMachineSprite).model.isPlayerNear) as RebelMachineSprite;
         if (!machine) return false;

         let closestSocketIdx = -1;
         let minDist = 60;

         machine.sockets.forEach((socket, i) => {
            const worldPos = machine.getSocketWorldPosition(i)!;
            const dist = Phaser.Math.Distance.Between(player.x, player.y, worldPos.x, worldPos.y);
            if (dist < minDist && socket.connectedCableId !== null) {
               minDist = dist;
               closestSocketIdx = i;
            }
         });

         if (closestSocketIdx !== -1) {
            machine.disconnectCable(closestSocketIdx);
            MessageUtils.getInstance().addFlyMessage({
               key: 'scene_cable_unplugged',
               text: 'Cable unplugged',
               duration: 2000,
            });
            return true;
         }
      }
   }

   return false;
};
