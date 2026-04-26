import { Message } from '../../message/model';

export type DialogueCallbacksType = 'choiceEffects';

export const getExampleDialogue = (assetsPath: string, callbackList: { [key in DialogueCallbacksType]?: (...args: any) => void } = {}): Message[] => {
   return [
      {
         id: 'example_msg2',
         sceneId: 'Dialogue',
         background: '',
         playerId: 'player',
         characters: [
            { id: 'player', image: 'characters/player.png', position: 'left' },
            { id: 'sprite', image: 'characters/sprite.png', position: 'right' },
         ],
         content: [
            {
               type: 'dialogue',
               speaker: 'sprite',
               text: 'Viandante! Hai bisogno di coraggio per andare avanti. Vuoi affrontare la prova del cuore?',
            },
            {
               type: 'choice',
               choices: [
                  {
                     text: 'Accetta la prova',
                     next: {
                        type: 'message',
                        id: 'example_msg3',
                     },
                     onChosen: (state: any) => {
                        //state.stats['courage'] = (state.stats['courage'] || 0) + 1;
                     },
                  },
                  {
                     text: 'Declina e prosegui',
                     next: {
                        type: 'scene',
                        id: 'ChapterTemplate',
                     },
                  },
               ],
            },
         ],
      },
      {
         id: 'example_msg3',
         sceneId: 'Dialogue',
         background: ``,
         playerId: 'player',
         characters: [{ id: 'player', image: 'characters/player.png', position: 'center' }],
         content: [
            {
               type: 'dialogue',
               speaker: 'player',
               text: 'Sento una nuova forza dentro di me.',
            },
         ],
         next: {
            type: 'scene',
            id: 'Dialogue',
         },
      },
   ];
};
