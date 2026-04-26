import { Timeline } from '../../../Timeline';

export const freddyRebelMachinesSlayerTimeline: Timeline[] = [
   {
      id: 'IntroPrologue',
      nextScene: 'MenuStart',
   },
   {
      id: 'Level0',
      nextScene: 'MapScene',
   },
   {
      id: 'Level1',
      nextScene: 'dynamicNextScene',
   },
   {
      id: 'Level2',
      nextScene: 'dynamicNextScene',
   },
   {
      id: 'Level3',
      nextScene: 'EndingScene',
   },
   {
      id: 'EndingScene',
      nextScene: 'MenuStart',
   },
];
