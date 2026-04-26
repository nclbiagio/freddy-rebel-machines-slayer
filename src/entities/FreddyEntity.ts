import { Animations, Scene } from 'phaser';
import { FreddyPlayerSprite, FreddyModel } from '../sprites/FreddyPlayer';
import { EntityModel } from '../models/Entity';
import { AnimationService } from '../core/graphics/AnimationService';
import { TILESIZE } from '../GameService';

export class FreddyEntity extends FreddyPlayerSprite {
   static spriteKey = 'freddy';

   constructor(scene: Scene, props: EntityModel) {
      super(scene, props);
   }

   static create(scene: Scene, props: { x: number; y: number }, model?: Partial<FreddyModel>): FreddyEntity {
      const entity = new FreddyEntity(scene, { id: self.crypto.randomUUID(), key: FreddyEntity.spriteKey, ...props });
      if (model) {
         entity.setModel(model);
      }
      entity.setAnimations(scene.anims);
      entity.setBody();
      return entity;
   }

   static loadSpritesheet(scene: Scene) {
      // Spritesheet del corpo senza braccia
      scene.load.spritesheet(FreddyEntity.spriteKey, `spritesheet/${FreddyEntity.spriteKey}.png`, {
         frameWidth: TILESIZE,
         frameHeight: TILESIZE,
      });
      // Il braccio è ora disegnato dinamicamente tramite Phaser.Rectangle in FreddyPlayer.ts
   }

   setBody() {
      super.setPlayerBody((animKey) => {
         if (animKey.includes('Fire')) {
            this.setModel({ status: 'run' });
         }
      });

      // Il braccio è un rettangolo Phaser, ci assicuriamo solo che sia visibile
      if (this.armSprite) {
         this.armSprite.setVisible(true);
      }
   }

   setAnimations(sceneAnims: Animations.AnimationManager) {
      const as = AnimationService.getInstance();
      if (!as.animationIsAdded(FreddyEntity.spriteKey)) {
         const animations = [
            {
               key: `${this.model.key}Idle`,
               frames: sceneAnims.generateFrameNumbers(FreddyEntity.spriteKey, { start: 0, end: 3 }),
               frameRate: 6,
               repeat: -1,
            },
            {
               key: `${this.model.key}Run`,
               frames: sceneAnims.generateFrameNumbers(FreddyEntity.spriteKey, { start: 4, end: 9 }),
               frameRate: 12,
               repeat: -1,
            },
            {
               key: `${this.model.key}Dead`,
               frames: sceneAnims.generateFrameNumbers(FreddyEntity.spriteKey, { start: 10, end: 10 }),
               frameRate: 1,
               repeat: 0,
            },
            {
               key: `${this.model.key}Crushed`,
               frames: sceneAnims.generateFrameNumbers(FreddyEntity.spriteKey, { start: 11, end: 11 }),
               frameRate: 1,
               repeat: 0,
            },
         ];
         // Creiamo ignorando mancati frame temporanei se lo spritesheet effettivo non li ha ancora
         animations.forEach((anim) => {
            try {
               sceneAnims.create(anim);
            } catch (e) {}
         });
         as.addAnimation(FreddyEntity.spriteKey);
      }
   }

   override update(time: number, tileProperties?: any) {
      super.update(time, tileProperties);

      if (this.model.status === 'run') {
         this.anims.play(`${this.model.key}Run`, true);
      } else if (this.model.status === 'idle') {
         this.anims.play(`${this.model.key}Idle`, true);
      } else if (this.model.status === 'dead') {
         this.anims.play(`${this.model.key}Dead`, true);
      } else if (this.model.status === 'crushed') {
         this.anims.play(`${this.model.key}Crushed`, true);
      }
   }
}
