import { GameSceneTypes } from '../GameService';
import { Message } from '../message/model';
import { PlayerStateService } from '../game/state/PlayerState';
import { ProgressManager } from '../core/systems/ProgressManager';

export const getToExtendTravelMessages = (assetsPath: string, nextScene: GameSceneTypes): Message[] => {
   const playerState = PlayerStateService.getInstance();
   const storyProgress = ProgressManager.getInstance();
   return [];
};
