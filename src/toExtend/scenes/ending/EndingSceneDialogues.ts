import { Message } from '../../../message/model';

export type DialogueCallbacksType = 'onNextCallback';

export const endingSceneDialogues = (assetsPath: string, callbackList: { [key in DialogueCallbacksType]?: (...args: any) => any } = {}): Message[] => {
   return [
      {
         id: `ending_outro`,
         sceneId: 'EndingScene',
         background: `${assetsPath}spritesheet/bg_sunny_day_wide_animated.png`,
         bgAnimated: true,
         frames: 8,
         bgm: 'ending',
         playerId: 'commander',
         characters: [
            { id: 'infiltrated', name: 'Infiltrator', image: `${assetsPath}spritesheet/hooded_man_talking.png`, animated: true },
            { id: 'commander', name: 'Commander', image: `${assetsPath}spritesheet/red_hair_man_talking.png`, animated: true },
         ],
         content: [
            {
               type: 'dialogue',
               speaker: 'infiltrated',
               text: "Commander... it's over. All the machines have been deactivated.",
            },
            {
               type: 'dialogue',
               speaker: 'commander',
               text: "He did it... that son of a bitch did it!",
            },
            {
               type: 'dialogue',
               speaker: 'commander',
               text: "AHAHAHAH! Freddy, you're a goddamn genius!",
            },
         ],
         next: { 
            type: 'scene', 
            id: 'EndingScene',
            callbackScene: () => {
               if (callbackList.onNextCallback) {
                  callbackList.onNextCallback();
               }
            }
         },
      },
   ];
};
