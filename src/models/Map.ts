import { GameSceneTypes } from '../GameService';

export interface MapLocation {
   id: GameSceneTypes;
   name: string;
   unlocked: boolean;
   icon: string; // URL o path icona
   visited: boolean;
   isCompleted: boolean; // Se non ha più eventi/dialoghi significativi
   hasNewContent: boolean; // Se è successo qualcosa di nuovo nel luogo, può essere usato per far lampeggiare l’icona, o segnalare con un badge.
   connectedTo: GameSceneTypes[]; // altri id di luoghi raggiungibili
   unlockConditions?: UnlockCondition[];
   subLocations?: MapLocation[];
   pos?: { xPct: number; yPct: number }; 
}

export interface UnlockCondition {
   type: 'dialogue' | 'event' | 'item';
   value: string; // es. ID del dialogo o nome item
}
