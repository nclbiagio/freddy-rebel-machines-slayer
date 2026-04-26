<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { EventBus } from '../../../../EventBus';
import { CombatState, Enemy } from '../../../../models/TurnCombatModel';
import { PlayerState, Spell } from '../../../../models/EquipmentAndStats';
import { PlayerStateService } from '../../../state/PlayerState';
import VictoryModal from './VictoryModal.vue';

defineProps<{ canvasWidth: string }>();

const playerStats = PlayerStateService.getInstance();

const player = ref<PlayerState | null>(null);
const playerMax = ref({ hp: playerStats.state.stats.health, mana: playerStats.state.stats.mana });
const playerSpells = ref<Spell[]>(playerStats.state.spells);
const playerName = playerStats.state.name;
const enemy = ref<Enemy | null>(null);
const turn = ref<'player' | 'enemy'>('player');

const basicAttack = () => {
   EventBus.emit('playerAction', { type: 'basic' });
};

const castSpell = (spellId: string) => {
   EventBus.emit('playerAction', { type: 'spell', id: spellId });
};

const flee = () => {
   EventBus.emit('playerAction', { type: 'flee' });
};

onMounted(() => {
   EventBus.on('stateUpdate', (state: CombatState) => {
      player.value = state.player;
      enemy.value = state.enemy;
      turn.value = state.turn;
   });
});
</script>

<template>
   <div class="combat-wrapper h-full p-6 rounded-2xl shadow-xl flex flex-col items-center mt-8 relative" :style="canvasWidth" v-if="player">
      <div class="status">
         <div>
            <h3>👤 {{ playerName }}</h3>
            <p>HP: {{ player.stats.health }} / {{ playerMax.hp }}</p>
            <p>Mana: {{ player.stats.mana }} / {{ playerMax.mana }}</p>
         </div>
         <div>
            <h3>👹 {{ enemy?.name }}</h3>
            <p>HP: {{ enemy?.hp }} / {{ enemy?.maxHp }}</p>
         </div>
      </div>

      <div v-if="turn === 'player'" class="actions">
         <button class="mb-1" @click="basicAttack">⚔ Attacco</button>
         <h4>🧙 Scegli un incantesimo:</h4>
         <button class="mb-1" v-for="spell in playerSpells" :key="spell.id" :disabled="spell.cost > player.stats.mana" @click="castSpell(spell.id)">
            {{ spell.name }} ({{ spell.cost }} Mana)
         </button>

         <button class="flee" @click="flee">🏃 Fuggi</button>
      </div>
      <VictoryModal />
   </div>
</template>

<style scoped>
.combat-wrapper {
   padding: 1rem;
   background: rgba(10, 10, 10, 0.85);
   color: white;
}

.status {
   display: flex;
   justify-content: space-between;
   margin-bottom: 1rem;
   width: 100%;
}

.actions button {
   margin: 0.25rem;
   padding: 0.5rem 1rem;
}

.log {
   margin-top: 1rem;
   background: #111;
   padding: 0.5rem;
   max-height: 150px;
   overflow-y: auto;
   font-size: 0.9rem;
}

.flee {
   background: darkred;
   color: white;
}
</style>
