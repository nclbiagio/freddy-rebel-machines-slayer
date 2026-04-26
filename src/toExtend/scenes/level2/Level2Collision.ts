import { MessageUtils } from '../../../message/Message';
import { BaseCollisionEntities, BaseCollisionService, BaseCollisionServiceCallbacksType } from '../../../scenes/_template/BaseCollisionService';
import { CableSprite } from '../../../sprites/Cable';
import { MagnetProjectile } from '../../../entities/MagnetProjectile';
import { FreddyEntity } from '../../../entities/FreddyEntity';
import { BouncyGoo } from '../../../entities/BouncyGoo';
import { MainframeEntity } from '../../../entities/MainframeEntity';
import { ExplosionService } from '../../../core/graphics/Explosion';

export interface Level2CollisionEntities extends BaseCollisionEntities {
   cables: Phaser.GameObjects.Group;
   playerBullets: Phaser.GameObjects.Group;
   machines: Phaser.GameObjects.Group;
   bouncyGoos: Phaser.GameObjects.Group;
}

export type Level2CollisionCallbacks = BaseCollisionServiceCallbacksType;

export class Level2CollisionService extends BaseCollisionService<Level2CollisionEntities, Level2CollisionCallbacks> {
   protected addSceneColliders(): void {
      const { player, groundLayer, cables, playerBullets, machines, bouncyGoos } = this.entities;

      // 1. Collisione Cavi e Macchine con il Terreno
      this.scene.physics.add.collider(cables, groundLayer);
      this.scene.physics.add.collider(machines, groundLayer);

      // 1.1 Collisione Player con Gelatina Rimbalzante
      this.scene.physics.add.collider(player, bouncyGoos, (p, g) => {
         const freddy = p as FreddyEntity;
         const goo = g as BouncyGoo;

         // Se Freddy atterra sulla sommità della gelatina
         if (freddy.body.touching.down && goo.body.touching.up) {
            // Effetto "Boing": Sbalzato in aria
            freddy.body.setVelocityY(goo.model.bounceForce);
            goo.bounce();
         }
      });

      // 1.2 Overlap Letale con l'Acido (permette di "entrare" nella pozza)
      this.scene.physics.add.overlap(player, groundLayer, (p, t) => {
         const tile = t as Phaser.Tilemaps.Tile;
         // Controlliamo la custom property 'lethal' impostata direttamente in Tiled
         if (tile.properties && (tile.properties as any).lethal) {
            const freddy = p as FreddyEntity;
            if (freddy.model.status !== 'dead') {
               freddy.decreaseHpStatus(freddy.model.lives);

               MessageUtils.getInstance().addFlyMessage({
                  key: 'scene_acid_death',
                  text: 'LETHAL ACID!',
               });
            }
         }
      });

      // 1.2.1 Collisione specifica con gocce acido del Mainframe
      const mainframe = machines.getChildren().find((m) => m instanceof MainframeEntity) as MainframeEntity;
      if (mainframe && mainframe.acidDrops) {
         this.scene.physics.add.overlap(player, mainframe.acidDrops, (p, d) => {
            const freddy = p as FreddyEntity;
            const drop = d as any;

            // --- PROTEZIONE CINEMATICA ---
            // Se la cinematica è in corso, distruggiamo la goccia senza uccidere Freddy
            const data: any = this.callbackList.getSceneData ? this.callbackList.getSceneData() : null;
            const isCinematic = data?.others?.isCinematicPlaying;

            if (isCinematic) {
               drop.destroy();
               return;
            }

            if (freddy.model.status !== 'dead') {
               freddy.decreaseHpStatus(freddy.model.lives);

               // Esplosione acida all'impatto con Freddy
               const acidExplosion = ExplosionService.getInstance(this.scene).getByType('acid');
               if (acidExplosion && acidExplosion.particleEmitter) {
                  acidExplosion.particleEmitter.explode(15, drop.x, drop.y);
               }

               MessageUtils.getInstance().addFlyMessage({
                  key: 'scene_acid_death',
                  text: 'LETHAL ACID!',
               });
            }
            drop.destroy();
         });

         // 1.2.2 Collisione acido con il terreno (Esplosione/Schizzo)
         this.scene.physics.add.collider(mainframe.acidDrops, groundLayer, (d) => {
            const drop = d as Phaser.Physics.Arcade.Sprite;

            // Usiamo il servizio esplosioni ufficiale per l'acido
            const acidExplosion = ExplosionService.getInstance(this.scene).getByType('acid');
            if (acidExplosion && acidExplosion.particleEmitter) {
               acidExplosion.particleEmitter.explode(10, drop.x, drop.y);
            }

            drop.destroy();
         });
      }

      // 1.3 Collisione Proiettili con il Terreno
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
               text: 'Cable hooked (LV2)!',
            });
         }
      });
   }
}
