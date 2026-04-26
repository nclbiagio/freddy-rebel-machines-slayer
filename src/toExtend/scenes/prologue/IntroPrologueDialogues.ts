import { Message } from '../../../message/model';
import { IntroPrologueScene } from './IntroPrologue';

export type DialogueCallbacksType = 'onNextCallback';

export const introPrologueDialogues = (assetsPath: string, callbackList: { [key in DialogueCallbacksType]?: (...args: any) => any } = {}): Message[] => {
   return [
      {
         id: `prologue_intro`,
         sceneId: IntroPrologueScene.sceneKey,
         background: `${assetsPath}spritesheet/bg_thunderstorm_animated.png`,
         bgAnimated: true,
         playerId: 'commander',
         characters: [
            { id: 'infiltrated', name: 'Infiltrator', image: `${assetsPath}spritesheet/hooded_man_talking.png`, animated: true },
            { id: 'commander', name: 'Commander', image: `${assetsPath}spritesheet/red_hair_man_talking.png`, animated: true },
         ],
         content: [
            {
               type: 'dialogue',
               speaker: 'infiltrated',
               text: "The dawn of the rebel machines has begun. There's no more time.",
            },
            {
               type: 'dialogue',
               speaker: 'commander',
               text: "Don't worry. We have the right person... the one who will save us all.",
            },
         ],
         next: { 
            type: 'scene', 
            id: IntroPrologueScene.sceneKey,
            callbackScene: () => {
               if (callbackList.onNextCallback) {
                  callbackList.onNextCallback();
               }
            }
         },
      },
   ];
};
