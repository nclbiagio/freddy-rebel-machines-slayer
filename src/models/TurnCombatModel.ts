import { GameSceneTypes } from '../GameService';
import { PlayerState } from './EquipmentAndStats';

export interface LootEntry {
   id: string; // ← Item.id
   chance: number; // ← 0‑1  (0.25 = 25 %)
}

export interface Enemy {
   id: string;
   name: string;
   hp: number;
   maxHp: number;
   dmgMin: number;
   dmgMax: number;
   speed: number;
   agility?: number;
   fleeChance?: number; // 0-1 (default 0.7)
   xp?: number;
   lootTable?: LootEntry[]; // → array di Item.id da droppare
   // facoltativo: spells o status future
   biome: string;
   weight?: number; // probabilità relativa
}

export interface CombatState {
   turn: 'player' | 'enemy';
   player: PlayerState;
   enemy: Enemy;
   finished: boolean;
   victory: boolean;
   onFinishNextScene: GameSceneTypes;
   log?: string[];
}

export interface CombatRewardState {
   victory: boolean;
   xp: number;
   loot: string[];
}
