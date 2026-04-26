import { BaseCollisionEntities, BaseCollisionService, BaseCollisionServiceCallbacksType } from '../../../scenes/_template/BaseCollisionService';
import { MessageUtils } from '../../../message/Message';
import { FreddyEntity } from '../../../entities/FreddyEntity';
import { MagnetProjectile } from '../../../entities/MagnetProjectile';
import { CableSprite } from '../../../sprites/Cable';
import { SynthUtils } from '../../../core/audio/SynthUtils';

export interface Level3CollisionEntities extends BaseCollisionEntities {
   cables: Phaser.GameObjects.Group;
   playerBullets: Phaser.GameObjects.Group;
   machines: Phaser.GameObjects.Group;
   volcanicRocks?: Phaser.Physics.Arcade.Group;
}

export type Level3CollisionCallbacks = BaseCollisionServiceCallbacksType;

export class Level3CollisionService extends BaseCollisionService<Level3CollisionEntities, Level3CollisionCallbacks> {
   protected addSceneColliders(): void {
      const { player, groundLayer, cables, playerBullets, machines } = this.entities;

      // 1. Collisione Cavi e Macchine con il Terreno
      this.scene.physics.add.collider(cables, groundLayer);
      this.scene.physics.add.collider(machines, groundLayer);

      // 2. Collisione Proiettili con il Terreno
      this.scene.physics.add.collider(playerBullets, groundLayer, (bullet) => {
         (bullet as MagnetProjectile).startRetracting();
      });

      // 2.1 Overlap Letale con il Magma (Lava)
      this.scene.physics.add.overlap(player, groundLayer, (p, t) => {
         const tile = t as Phaser.Tilemaps.Tile;
         // Controlliamo la custom property 'lethal' impostata in Tiled per il magma
         if (tile.properties && (tile.properties as any).lethal) {
            const freddy = p as FreddyEntity;
            if (freddy.model.status !== 'dead') {
               freddy.decreaseHpStatus(freddy.model.lives);

               MessageUtils.getInstance().addFlyMessage({
                  key: 'scene_magma_death',
                  text: 'INCANDESCENT MAGMA!',
               });
            }
         }
      });

      // 3. Overlap Magnete con Cavi (Raccolta)
      this.scene.physics.add.overlap(playerBullets, cables, (bullet, cable) => {
         const magnet = bullet as MagnetProjectile;
         const cableSprite = cable as CableSprite;

         if (magnet.active && cableSprite.model.status === 'idle' && cableSprite.canBeHeld()) {
            (player as FreddyEntity).holdCable(cableSprite);
            cableSprite.hold();
            magnet.dead();

            MessageUtils.getInstance().addFlyMessage({
               key: 'cable_captured_lv3',
               text: 'Cable recovered in the mine!',
            });
         }
      });
      
      // 4. Collisioni Massi Vulcanici (Escavatore Ribelle)
      if (this.entities.volcanicRocks) {
         const rocks = this.entities.volcanicRocks;
         const explosions = (this.scene as any).explosions;

         // Impatto con il terreno: Esplosione, tremolio e distruzione
         this.scene.physics.add.collider(rocks, groundLayer, (rock) => {
            if (explosions) {
               explosions.explode(rock as any, 'volcanic', 15);
            }
            // Feedback fisico e sonoro
            this.scene.cameras.main.shake(150, 0.004);
            SynthUtils.playExplosionSound(0.3);
            rock.destroy();
         });

         // Impatto con Freddy: Morte immediata, forte tremolio
         this.scene.physics.add.overlap(player, rocks, (p, r) => {
            const freddy = p as FreddyEntity;
            if (freddy.model.status !== 'dead') {
               // Feedback di impatto violento
               this.scene.cameras.main.shake(300, 0.015);
               SynthUtils.playExplosionSound(0.6);
               
               freddy.decreaseHpStatus(freddy.model.lives);
               MessageUtils.getInstance().addFlyMessage({
                  key: 'rock_crush_lv3',
                  text: 'CRUSHED BY A VOLCANIC ROCK!',
               });
            }
         });
      }
      
      // Nota: La collisione con il braccio dell'escavatore è gestita in ExcavatorEntity.updateExcavator
   }
}
