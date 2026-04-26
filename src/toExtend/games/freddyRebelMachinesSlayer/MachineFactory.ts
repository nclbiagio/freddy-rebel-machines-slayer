import { getObjectPropValueFromTiled } from '../../../core/utils/MapUtils';
import { BaseScene } from '../../../scenes/_template/BaseScene';
import { ExcavatorEntity } from '../../../entities/ExcavatorEntity';
import { CarEntity } from '../../../entities/CarEntity';
import { DroneEntity } from '../../../entities/DroneEntity';
import { MainframeEntity } from '../../../entities/MainframeEntity';
import { WashingMachineEntity } from '../../../entities/WashingMachineEntity';
import { RebelMachineModel } from '../../../sprites/RebelMachine';

export interface MachineCreationProps {
   x: number;
   y: number;
   type: string;
   sequence?: string; // e.g. "blue,red,yellow,green"
   flashInterval?: number;
}

const parseSequence = (sequenceStr: string): Array<{ socketId: number; color: string }> => {
   if (!sequenceStr) return [];
   return sequenceStr.split(',').map((color, index) => ({
      socketId: index + 1,
      color: color.trim(),
   }));
};

const resolveMachineData = (obj: Phaser.Types.Tilemaps.TiledObject): MachineCreationProps => {
   return {
      x: obj.x || 0,
      y: obj.y || 0,
      // Usiamo ESCLUSIVAMENTE la custom prop 'type' definita su Tiled
      type: getObjectPropValueFromTiled(obj, 'type', 'excavator'),
      sequence: getObjectPropValueFromTiled(obj, 'sequence', ''),
      flashInterval: getObjectPropValueFromTiled(obj, 'flashInterval', 800),
   };
};

export const createMachinesGroup = (scene: BaseScene<any, any>, layer: Phaser.Tilemaps.ObjectLayer | undefined): Phaser.GameObjects.Group => {
   const group = scene.add.group();
   const machinesToParse = layer?.objects || [];

   if (machinesToParse.length > 0) {
      machinesToParse.forEach((obj) => {
         const data = resolveMachineData(obj);
         const isRebel = getObjectPropValueFromTiled(obj, 'isRebel', true);
         const sequence = isRebel ? parseSequence(data.sequence || '') : [];

         const model: Partial<RebelMachineModel> = {
            flashInterval: data.flashInterval,
            isSolved: !isRebel, // Se non è ribelle, è già "risolta" o inattiva
         };

         if (isRebel && sequence.length > 0) {
            model.activeSequence = sequence;
         }

         let machine;
         // Se non è ribelle, non passiamo i socket (array vuoto)
         const finalSockets = isRebel ? undefined : [];

         switch (data.type.toLowerCase()) {
            case 'excavator':
               machine = ExcavatorEntity.createExcavator(scene, { x: data.x, y: data.y }, model, finalSockets);
               break;
            case 'car':
               machine = CarEntity.create(scene, { x: data.x, y: data.y }, model, finalSockets);
               break;
            case 'mainframe':
               machine = MainframeEntity.create(scene, { x: data.x, y: data.y }, model);
               break;
            case 'washing_machine':
               machine = WashingMachineEntity.create(scene, { x: data.x, y: data.y }, model);
               break;
            default:
               console.warn(`Unknown machine type: ${data.type}, falling back to excavator`);
               machine = ExcavatorEntity.createExcavator(scene, { x: data.x, y: data.y }, model, finalSockets);
         }

         if (machine) {
            // Se non è ribelle, rimuoviamo i socket se creati per errore o forziamo l'array vuoto
            if (!isRebel) {
               machine.sockets = [];
            }

            // Applichiamo il flip se definito nelle proprietà di Tiled
            const flipX = getObjectPropValueFromTiled(obj, 'flipX', false) || obj.flippedHorizontal;
            if (flipX) {
               machine.setFlipX(true);
               // Se è un escavatore, dobbiamo rifare l'aggiornamento dell'offset braccio
               if (machine instanceof ExcavatorEntity) {
                  machine.updateExcavator(0); // Forza sync iniziale
               }
            }
            group.add(machine);
         }
      });
   }
   return group;
};
