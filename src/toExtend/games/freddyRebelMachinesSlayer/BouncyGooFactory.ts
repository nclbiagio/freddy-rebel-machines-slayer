import { getObjectPropValueFromTiled } from '../../../core/utils/MapUtils';
import { BouncyGoo, BouncyGooModel } from '../../../entities/BouncyGoo';
import { BaseScene } from '../../../scenes/_template/BaseScene';

export interface BouncyGooCreationProps {
   x: number;
   y: number;
   bounceForce: number;
}

const resolveBouncyGooData = (obj: Phaser.Types.Tilemaps.TiledObject): BouncyGooCreationProps => {
   return {
      x: obj.x || 0,
      y: obj.y || 0,
      bounceForce: getObjectPropValueFromTiled(obj, 'bounceForce', -850),
   };
};

export const createBouncyGooGroup = (scene: BaseScene<any, any>, layer: Phaser.Tilemaps.ObjectLayer | undefined): Phaser.GameObjects.Group => {
   const group = scene.add.group();
   const goosToParse = layer?.objects || [];

   if (goosToParse.length > 0) {
      goosToParse.forEach((obj) => {
         const data = resolveBouncyGooData(obj);

         const model: Partial<BouncyGooModel> = {
            bounceForce: data.bounceForce,
         };

         // Creamo l'entità. 
         // NOTA: Tiled setta l'origine degli oggetti in basso a sinistra se sono rettangoli, 
         // ma Sprite in Phaser usa il centro. Dobbiamo compensare o assicurarsi dell'origin.
         // Per ora assumiamo il punto (x,y) come base centrale.
         const gooEntity = BouncyGoo.create(scene, { x: data.x, y: data.y }, model);
         if (gooEntity) {
            group.add(gooEntity);
         }
      });
   }
   return group;
};
