import { MessageUtils } from '../../../message/Message';
import { BaseCollisionEntities, BaseCollisionService, BaseCollisionServiceCallbacksType } from '../../../scenes/_template/BaseCollisionService';
import { CableSprite } from '../../../sprites/Cable';
import { MagnetProjectile } from '../../../entities/MagnetProjectile';
import { FreddyEntity } from '../../../entities/FreddyEntity';

export interface Level0CollisionEntities extends BaseCollisionEntities {
   cables: Phaser.GameObjects.Group;
   playerBullets: Phaser.GameObjects.Group;
   machines: Phaser.GameObjects.Group;
}

export type Level0CollisionCallbacks = BaseCollisionServiceCallbacksType;

export class Level0CollisionService extends BaseCollisionService<Level0CollisionEntities, Level0CollisionCallbacks> {
   protected addSceneColliders(): void {
      const { player, groundLayer, cables, playerBullets, machines } = this.entities;

      // 1. Collisione Cavi e Macchine con il Terreno
      this.scene.physics.add.collider(cables, groundLayer);
      this.scene.physics.add.collider(machines, groundLayer);

      // 1.1 Collisione Proiettili con il Terreno
      this.scene.physics.add.collider(playerBullets, groundLayer, (bullet) => {
         (bullet as MagnetProjectile).startRetracting();
      });

      // 2. Overlap Magnete con Cavi (Raccolta)
      this.scene.physics.add.overlap(playerBullets, cables, (bullet, cable) => {
         const magnet = bullet as MagnetProjectile;
         const cableSprite = cable as CableSprite;

         if (magnet.active && cableSprite.model.status === 'idle' && cableSprite.canBeHeld()) {
            // Effetto cattura
            (player as FreddyEntity).holdCable(cableSprite);
            cableSprite.hold(); // Passa a stato held
            magnet.dead(); // Il magnete svanisce dopo il contatto

            MessageUtils.getInstance().addFlyMessage({
               key: 'scene_level0_cable_captured',
               text: 'Cable hooked!',
            });
         }
      });
   }
}
