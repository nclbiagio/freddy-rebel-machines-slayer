import { GameSceneTypes } from '../../../../GameService';
import { Message } from '../../../../message/model';
import { getToExtendTravelMessages } from '../../../../toExtend/TravelMessages';
import { decideIfEnemyEncounter } from '../../../data/TurnCombatEnemies';
import { PlayerStateService } from '../../../state/PlayerState';
import { ProgressManager } from '../../../../core/systems/ProgressManager';

export const getTravelMessages = (assetsPath: string, nextScene: GameSceneTypes): Message[] => {
   const playerState = PlayerStateService.getInstance();
   const storyProgress = ProgressManager.getInstance();
   const toExtendTravelMessages = getToExtendTravelMessages(assetsPath, nextScene);
   return [
      {
         id: 'msgExample',
         sceneId: 'ChapterTravel',
         playerId: 'player',
         background: ``,
         transition: 'fadeIn',
         content: [
            {
               image: `${assetsPath}images/forest.png`,
               type: 'caption',
               text: 'Ti incammini verso la Foresta Velata',
            },
            {
               type: 'outcome',
               summary: '...', //TODO math random between an array of string ['...', 'you heard a song']
               autoAdvance: true,
               delay: 12200,
               next: decideIfEnemyEncounter('forest', nextScene), //TODO ChapterTemplate to be changed
            },
         ],
      },
      ...toExtendTravelMessages,
   ];
};
