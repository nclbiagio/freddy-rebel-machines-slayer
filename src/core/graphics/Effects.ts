import { PosGetter } from '../../models/Game';

type AbsorbGroup = {
   tweens: Phaser.Tweens.Tween[];
   graphics: Phaser.GameObjects.Graphics[];
};

const activeAbsorbGroups = new Map<string, AbsorbGroup>();

/**
 * Avvia un gruppo di fasci persistenti per tweenKey (es. `absorb-${enemy.id}`)
 * - i fasci leggono source & target ad ogni onUpdate
 */
export function startAbsorbEffect(
   scene: Phaser.Scene,
   getSourcePos: PosGetter,
   getTargetPos: PosGetter,
   tweenKey: string,
   opts?: { beams?: number; baseDuration?: number; stagger?: number },
   callBackOnComplete?: (data?: any) => void
) {
   if (activeAbsorbGroups.has(tweenKey)) return; // già attivo

   const beams = opts?.beams ?? 10;
   const baseDuration = opts?.baseDuration ?? 300;
   const stagger = opts?.stagger ?? 50;

   const tweens: Phaser.Tweens.Tween[] = [];
   const graphics: Phaser.GameObjects.Graphics[] = [];
   let finishedTweens = 0;

   for (let i = 0; i < beams; i++) {
      const gfx = scene.add.graphics();
      gfx.setBlendMode(Phaser.BlendModes.ADD);
      graphics.push(gfx);

      // offset fissati ONE-TIME per questo fascio
      const offsetX = Phaser.Math.Between(-20, 20);
      const offsetY = Phaser.Math.Between(-20, 20);

      const tween = scene.tweens.addCounter({
         from: 0,
         to: 1,
         duration: baseDuration,
         delay: i * stagger, // stagger iniziale
         //repeat: -1,           // loop infinito
         // optional: repeatDelay: 0,
         onUpdate: (tw) => {
            const progress = tw.getValue() as number;

            // prendo posizioni aggiornate ad ogni frame
            const source = getSourcePos();
            const target = getTargetPos();

            const startX = source.x + offsetX;
            const startY = source.y + offsetY;

            const currentX = Phaser.Math.Interpolation.Linear([startX, target.x], progress);
            const currentY = Phaser.Math.Interpolation.Linear([startY, target.y], progress);

            gfx.clear();
            gfx.lineStyle(2, 0xffff66, 1 - progress);
            gfx.beginPath();
            gfx.moveTo(startX, startY);
            gfx.lineTo(currentX, currentY);
            gfx.strokePath();
         },
         onComplete: () => {
            gfx.destroy();
            finishedTweens++;

            // quando tutti i fasci sono finiti, pulisco la key
            if (finishedTweens === beams) {
               activeAbsorbGroups.delete(tweenKey);
               if (callBackOnComplete) {
                  callBackOnComplete();
               }
            }
         },
      });

      tweens.push(tween);
   }

   activeAbsorbGroups.set(tweenKey, { tweens, graphics });
}
