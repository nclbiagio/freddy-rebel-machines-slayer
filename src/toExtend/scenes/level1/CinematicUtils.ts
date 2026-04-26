import { Level1Scene } from './Level1';
import { LevelStore } from '../../../game/state/LevelStore';
import { MachineEntity } from '../../../entities/MachineEntity';
import { MessageUtils } from '../../../message/Message';

export const playLevel1Intro = (scene: Level1Scene, machine: MachineEntity) => {
   const levelStore = LevelStore.getInstance();
   const sceneKey = Level1Scene.sceneKey;

   // 1. MESSAGGIO NARRATIVO IMMEDIATO
   MessageUtils.getInstance().addFlyMessage({
      key: 'scene_sequence_lv1',
      text: '⚠️ MEMORY SEQUENCE DETECTED',
      duration: 3000,
   });

   // Set cinematic state in store
   levelStore.setLevelStore(sceneKey, { others: { isCinematicPlaying: true } });

   // 2. AVVIO CINEMATICA (Piccolo delay per il fade-in iniziale della scena)
   scene.introTimer = scene.time.delayedCall(1000, () => {
      scene.cameras.main.stopFollow();

      // Pan verso la Macchina
      scene.cameras.main.pan(machine.x, machine.y, 2500, 'Power2');

      scene.cameras.main.once('camerapancomplete', () => {
         // Trigger della sequenza della macchina
         machine.revealSequence();

         // Aspettiamo che la sequenza finisca prima di tornare indietro
         scene.introTimer = scene.time.delayedCall(3000, () => {
            if (scene.player) {
               scene.cameras.main.pan(scene.player.x, scene.player.y, 1800, 'Power2');

               scene.cameras.main.once('camerapancomplete', () => {
                  finishIntro(scene);
               });
            }
         });
      });
   });
};

const finishIntro = (scene: Level1Scene) => {
   const levelStore = LevelStore.getInstance();
   const sceneKey = Level1Scene.sceneKey;

   scene.cameras.main.startFollow(scene.player, true, 0.5, 0.5);

   // Avviamo la sfida (e il timer) ora che la cinematica è finita
   scene.startChallenge();

   levelStore.setLevelStore(sceneKey, {
      others: {
         isCinematicPlaying: false,
      },
   });

   if (scene.introTimer) {
      scene.introTimer.destroy();
      scene.introTimer = null;
   }
};
