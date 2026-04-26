import { Level2Scene } from './Level2';
import { LevelStore } from '../../../game/state/LevelStore';
import { RebelMachineSprite } from '../../../sprites/RebelMachine';
import { MessageUtils } from '../../../message/Message';

export const playLevel2Intro = (scene: Level2Scene, machine: RebelMachineSprite) => {
   const levelStore = LevelStore.getInstance();
   const sceneKey = Level2Scene.sceneKey;

   // 1. MESSAGGIO NARRATIVO IMMEDIATO
   MessageUtils.getInstance().addFlyMessage({
      key: 'scene_sequence_lv2',
      text: '☣️ CHEMICAL MAIN FRAME BREACHED',
      duration: 3000,
   });

   // Set cinematic state in store
   levelStore.setLevelStore(sceneKey, { others: { isCinematicPlaying: true } });

   // 2. AVVIO CINEMATICA
   scene.introTimer = scene.time.delayedCall(1000, () => {
      scene.cameras.main.stopFollow();

      // Pan verso il Mega Computer
      scene.cameras.main.pan(machine.x, machine.y, 2500, 'Power2');

      scene.cameras.main.once('camerapancomplete', () => {
         // Trigger della sequenza della macchina (glitch e segnali)
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

const finishIntro = (scene: Level2Scene) => {
   const levelStore = LevelStore.getInstance();
   const sceneKey = Level2Scene.sceneKey;

   scene.cameras.main.startFollow(scene.player, true, 0.5, 0.5);

   // Avviamo la sfida
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
