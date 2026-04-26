import { PlayerStateService } from '../game/state/PlayerState';
import { ProgressManager } from '../core/systems/ProgressManager';
import { Message } from './model';

export const getExampleVn = (assetsPath: string): Message[] => {
   const playerState = PlayerStateService.getInstance();
   const storyProgress = ProgressManager.getInstance();
   return [
      {
         id: 'msg1',
         sceneId: 'ChapterTemplate',
         background: `${assetsPath}images/forest.png`,
         playerId: 'player',
         characters: [{ id: 'player', image: 'characters/player.png', position: 'center' }],
         content: [
            {
               type: 'caption',
               text: 'Ti risvegli in una foresta antica. Una nebbia magica avvolge ogni cosa.',
            },
            {
               type: 'dialogue',
               speaker: 'player',
               text: 'Dove mi trovo...? Questa foresta... non è su nessuna mappa.',
            },
         ],
         next: {
            type: 'message',
            id: 'msg2',
         },
      },
      {
         id: 'msg2',
         sceneId: 'ChapterTemplate',
         background: `${assetsPath}images/forest.png`,
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
                        id: 'msg3',
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
                        msgId: '',
                     },
                  },
               ],
            },
         ],
      },
      {
         id: 'msg3',
         sceneId: 'ChapterTemplate',
         background: `${assetsPath}images/forest.png`,
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
            id: 'ChapterTemplate', //
            msgId: '',
         },
      },
   ];
};

export const exampleVn: Message[] = [
   /* {
       id: 'msg4',
       sceneId: 'deepForest',
       background: 'bg/forest_deep.png',
       playerId: 'player',
       characters: [{ id: 'player', image: 'characters/player.png', position: 'center' }],
       content: [
          {
             type: 'dialogue',
             speaker: 'player',
             text: 'Un pugnale... sembra incantato.',
          },
          {
             type: 'choice',
             choices: [
                {
                   text: 'Raccogli il pugnale',
                   next: {
                      type: 'message',
                      id: 'msg5',
                   },
                   onChosen: (state: any) => {
                      state.inventory.push('Pugnale della Nebbia');
                      state.stats['courage'] = (state.stats['courage'] || 0) + 1;
                   },
                },
                {
                   text: 'Ignora e prosegui',
                   next: {
                      type: 'message',
                      id: 'msg6',
                   },
                },
             ],
          },
       ],
    },
    {
       id: 'msg5',
       sceneId: 'deepForest',
       background: 'bg/forest_deep.png',
       playerId: 'player',
       characters: [{ id: 'player', image: 'characters/player.png', position: 'center' }],
       content: [
          {
             type: 'caption',
             text: 'Il pugnale vibra nella tua mano. Un potere misterioso si risveglia.',
          },
       ],
       nextId: {
          type: 'message',
          id: 'msg6',
       },
    },
    {
       id: 'msg6',
       sceneId: 'caveEntrance',
       background: 'bg/cave_entrance.png',
       playerId: 'player',
       characters: [{ id: 'player', image: 'characters/player.png', position: 'center' }],
       content: [
          {
             type: 'dialogue',
             speaker: 'player',
             text: 'Ecco la grotta maledetta...',
          },
          {
             type: 'choice',
             choices: [
                {
                   text: 'Entra nella grotta',
                   next: {
                      type: 'message',
                      id: 'msg7',
                   },
                },
                {
                   text: 'Torna indietro nella foresta',
                   next: {
                      type: 'message',
                      id: 'msg2',
                   },
                },
             ],
          },
       ],
    },
    {
       id: 'msg7',
       sceneId: 'cursedCave',
       background: 'bg/cave_dark.png',
       playerId: 'player',
       characters: [
          { id: 'player', image: 'characters/player.png', position: 'center' },
          { id: 'guardian', image: 'characters/guardian.png', position: 'right' },
       ],
       content: [
          {
             type: 'combatChoice',
             enemy: 'Guardiano della Grotta',
             description: "Un'entità maledetta ti sbarra la strada!",
             choices: [
                {
                   text: 'Affronta con coraggio',
                   next: {
                      type: 'message',
                      id: 'msg8',
                   },
                   onChosen: (state: any) => {
                      state.stats['courage'] = (state.stats['courage'] || 0) + 1;
                   },
                },
                {
                   text: 'Usa il Pugnale della Nebbia',
                   next: {
                      type: 'message',
                      id: 'msg8',
                   },
                   onChosen: (state: any) => {
                      state.inventory = state.inventory.filter((item: any) => item !== 'Pugnale della Nebbia');
                   },
                },
                {
                   text: 'Fuggi nella foresta',
                   next: {
                      type: 'message',
                      id: 'msg9',
                   },
                },
             ],
          },
       ],
    },
    {
       id: 'msg8',
       sceneId: 'caveTreasure',
       background: 'bg/cave_treasure.png',
       characters: [{ id: 'player', image: 'characters/player.png', position: 'center' }],
       playerId: 'player',
       content: [
          {
             type: 'caption',
             text: 'Hai raggiunto la sala del tesoro. La maledizione è spezzata.',
          },
          {
            type: 'outcome',
            summary: 'Con coraggio e determinazione hai superato la sfida e ottenuto il potere del pugnale.',
            next: {
               type: 'scene',
               id: 'ending'
            }
         }
       ],
    },
    {
       id: 'msg9',
       sceneId: 'cursedCave',
       background: 'bg/cave_dark.png',
       characters: [{ id: 'player', image: 'characters/player.png', position: 'center' }],
       playerId: 'player',
       content: [
          {
             type: 'caption',
             text: 'La paura ti ha sopraffatto. Sarai pronto un altro giorno.',
          },
          {
            type: 'outcome',
            summary: 'Hai fallito, ma la storia potrebbe ricominciare.',
            next: {
               type: 'scene',
               id: 'ChapterTemplate',
               msgId: ''
            }
         }
       ]
    }, */
];
