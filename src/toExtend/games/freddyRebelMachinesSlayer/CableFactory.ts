import { getObjectPropValueFromTiled } from '../../../core/utils/MapUtils';
import { CableEntity } from '../../../entities/CableEntity';
import { BaseScene } from '../../../scenes/_template/BaseScene';
import { CableModel } from '../../../sprites/Cable';

export interface CablesCreationProps {
   x: number;
   y: number;
   color: string;
   maxLength: number;
   anchorOffsetX: number;
   anchorOffsetY: number;
   connectedMaxLength?: number;
   impulseIntervalMin?: number;
   impulseIntervalMax?: number;
   impulseDuration?: number;
   shockIntensity?: number;
   shockFrequency?: number;
}

const resolveCablesData = (obj: Phaser.Types.Tilemaps.TiledObject): CablesCreationProps => {
   return {
      x: obj.x || 0,
      y: obj.y || 0,
      color: getObjectPropValueFromTiled(obj, 'color', 'red'),
      maxLength: Number(getObjectPropValueFromTiled(obj, 'maxLength', 300)),
      anchorOffsetX: Number(getObjectPropValueFromTiled(obj, 'anchorOffsetX', 0)),
      anchorOffsetY: Number(getObjectPropValueFromTiled(obj, 'anchorOffsetY', 0)),
      connectedMaxLength: Number(getObjectPropValueFromTiled(obj, 'connectedMaxLength', 550)),
      impulseIntervalMin: Number(getObjectPropValueFromTiled(obj, 'impulseIntervalMin', 3000)),
      impulseIntervalMax: Number(getObjectPropValueFromTiled(obj, 'impulseIntervalMax', 6000)),
      impulseDuration: Number(getObjectPropValueFromTiled(obj, 'impulseDuration', 600)),
      shockIntensity: Number(getObjectPropValueFromTiled(obj, 'shockIntensity', 4.0)),
      shockFrequency: Number(getObjectPropValueFromTiled(obj, 'shockFrequency', 60)),
   };
};

export const createCablesGroup = (scene: BaseScene<any, any>, layer: Phaser.Tilemaps.ObjectLayer | undefined): Phaser.GameObjects.Group => {
   const group = scene.add.group();
   const cablesToParse = layer?.objects || [];

   if (cablesToParse.length > 0) {
      cablesToParse.forEach((obj) => {
         const data = resolveCablesData(obj);

         const model: Partial<CableModel> = {
            color: data.color as any,
            maxLength: data.maxLength,
            anchorOffsetX: data.anchorOffsetX,
            anchorOffsetY: data.anchorOffsetY,
            connectedMaxLength: data.connectedMaxLength,
            impulseInterval: { min: data.impulseIntervalMin || 3000, max: data.impulseIntervalMax || 6000 },
            impulseDuration: data.impulseDuration,
            shockIntensity: data.shockIntensity,
            shockFrequency: data.shockFrequency,
         };

         // Creamo l'entità. La posizione X,Y di Tiled funge da ancora.
         const cableEntity = CableEntity.create(scene, { x: data.x, y: data.y }, model);
         if (cableEntity) {
            group.add(cableEntity);
         }
      });
   }
   return group;
};
