import { MessageUtils } from '../../../message/Message';
import { BaseCollisionEntities, BaseCollisionService, BaseCollisionServiceCallbacksType } from '../../../scenes/_template/BaseCollisionService';
import { CableSprite } from '../../../sprites/Cable';
import { MagnetProjectile } from '../../../entities/MagnetProjectile';
import { FreddyEntity } from '../../../entities/FreddyEntity';

export interface Level1CollisionEntities extends BaseCollisionEntities {
   cables: Phaser.GameObjects.Group;
   playerBullets: Phaser.GameObjects.Group;
   machines: Phaser.GameObjects.Group;
   carLifts: Phaser.GameObjects.Group;
}

export type Level1CollisionCallbacks = BaseCollisionServiceCallbacksType;

export class Level1CollisionService extends BaseCollisionService<Level1CollisionEntities, Level1CollisionCallbacks> {
   protected addSceneColliders(): void {
      const { player, groundLayer, cables, playerBullets, machines, carLifts } = this.entities;

      // 1. Collisione Cavi e Macchine con il Terreno
      this.scene.physics.add.collider(cables, groundLayer);
      this.scene.physics.add.collider(machines, groundLayer);

      // 1.1 Collisione Player con CarLift (Piattaforme)
      this.scene.physics.add.collider(player, carLifts);

      // 1.2 Collisione Macchine con CarLift (facoltativo, permette all'auto di starci sopra)
      this.scene.physics.add.collider(machines, carLifts);

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
               key: 'cable_captured',
               text: 'Cable hooked!',
            });
         }
      });
   }
}
