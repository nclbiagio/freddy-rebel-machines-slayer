import { GameSceneTypes } from '../../GameService';
import { SceneReference } from '../../message/model';
import { Enemy } from '../../models/TurnCombatModel';

/**
 * Ensure that lootTable ids are available into ItemCatalog utils file
 * Es: frammento_luce is not available and will generate an error
 */

const enemies: Record<string, Enemy> = {
   wraith_lv1: {
      id: 'wraith_lv1',
      name: 'Spettro Ossesso',
      hp: 40,
      maxHp: 40,
      dmgMin: 5,
      dmgMax: 9,
      fleeChance: 0.8,
      speed: 10,
      lootTable: [
         { id: 'frammento_luce', chance: 0.8 },
         { id: 'potion_minor', chance: 0.4 },
      ],
      biome: 'forest',
      weight: 60,
   },
   wraith_lv2: {
      id: 'wraith_lv2',
      name: 'Spettro Avvizzito',
      hp: 60,
      maxHp: 60,
      dmgMin: 7,
      dmgMax: 12,
      speed: 10,
      fleeChance: 0.7,
      biome: 'forest',
      weight: 60,
   },
   bandit_corrupt: {
      id: 'bandit_corrupt',
      name: 'Bandito Corrotto',
      hp: 55,
      maxHp: 55,
      dmgMin: 6,
      speed: 1,
      dmgMax: 11,
      biome: 'forest',
      weight: 60,
   },
   guardian_silence: {
      id: 'guardian_silence',
      name: 'Guardiano del Silenzio',
      hp: 90,
      maxHp: 90,
      dmgMin: 10,
      dmgMax: 16,
      fleeChance: 0.5,
      speed: 1,
      lootTable: [
         { id: 'rune_shadow', chance: 0.5 },
         { id: 'armor_guardian', chance: 0.2 },
      ],
      biome: 'forest',
      weight: 60,
   },
   // ➕ Aggiungi qui altri nemici
};

/**
 * Restituisce l'oggetto Enemy dato l'id.
 * Lancia un errore se l'id non esiste (utile per debug).
 */
export function getEnemyById(id: string): Enemy {
   const enemy = enemies[id];
   if (!enemy) {
      throw new Error(`Enemy "${id}" non trovato nel database.`);
   }
   // Deep-clone per non mutare il catalogo
   return structuredClone(enemy);
}

export function pickEnemyIdByBiome(biome: string): string {
   const candidates = Object.values(enemies).filter((e) => e.biome === biome);

   if (candidates.length === 0) {
      console.warn(`Nessun nemico trovato per il bioma "${biome}", uso fallback`);
      return enemies[0].id;
   }

   const totalWeight = candidates.reduce((sum, e) => sum + (e.weight ?? 1), 0);
   const roll = Math.random() * totalWeight;

   let cumulative = 0;
   for (const enemy of candidates) {
      cumulative += enemy.weight ?? 1;
      if (roll < cumulative) {
         return enemy.id;
      }
   }

   return candidates[0].id; // fallback
}

export function decideIfEnemyEncounter(biome: string, safeSceneId: GameSceneTypes): SceneReference {
   const chance = biome === 'forest' ? 0.25 : 0.15; // % incontro
   if (Math.random() < chance) {
      const enemyId = pickEnemyIdByBiome(biome); // es. 'wraith_lv1'
      return { type: 'combatScene', id: 'TurnCombat', enemyId, nextScene: safeSceneId };
   }
   return { type: 'scene', id: safeSceneId };
}
