<script setup lang="ts">
import { ref } from 'vue';
import { PlayerStateService } from '../../game/state/PlayerState';
import EquippedItems from './EquippedItems.vue';
import { InspectedItem } from './model';
import InspectedItemModal from './InspectedItemModal.vue';

defineProps<{ canvasWidth: string }>();

const playerState = PlayerStateService.getInstance();

const equippedItems = ref(playerState.state.equippedItems);
const usableItems = ref(playerState.state.usableItems);
const stats = ref(playerState.state.stats);
const spells = ref(playerState.state.spells);
const money = ref(playerState.state.money);

const tabs = [
   { id: 1, label: 'Equipaggiamento' },
   { id: 2, label: 'Oggetti Usabili' },
   { id: 3, label: 'Statistiche' },
   { id: 4, label: 'Magie' },
];
const currentTab = ref<number>(1);

const inspectedItem = ref<InspectedItem>(null);

const inspectItemCallback = (element: InspectedItem) => {
   inspectedItem.value = element;
};

const updateValues = () => {
   equippedItems.value = { ...playerState.state.equippedItems };
   usableItems.value = [...playerState.state.usableItems];
   stats.value = { ...playerState.state.stats };
   spells.value = [...playerState.state.spells];
   money.value = playerState.state.money;
};

const closeInspectModal = (updateUi: boolean) => {
   inspectedItem.value = null;
   if (updateUi) {
      updateValues();
   }
};
</script>

<template>
   <div class="player-inventory relative p-4 bg-gray-900 text-white rounded-2xl shadow-lg" :style="canvasWidth">
      <div class="flex justify-between items-center mb-4">
         <h2 class="text-2xl font-bold">Inventario Giocatore</h2>
         <div class="flex text-yellow-400 font-semibold items-center">{{ money }} 💰</div>
      </div>

      <!-- Tabs -->
      <div class="tabs flex space-x-4 mb-4">
         <button
            v-for="tab in tabs"
            :key="tab.id"
            :class="['px-4 py-2 rounded-full', currentTab === tab.id ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600']"
            @click="currentTab = tab.id"
         >
            {{ tab.label }}
         </button>
      </div>

      <!-- Equipped Items -->
      <div v-if="currentTab === 1" class="grid grid-cols-2 gap-4">
         <EquippedItems :equipped-items="equippedItems" @inspectEquippedItem="inspectItemCallback" />
      </div>

      <!-- Usable Items -->
      <div v-else-if="currentTab === 2" class="grid grid-cols-2 gap-4">
         <div
            v-for="item in usableItems"
            :key="item.baseItem.key"
            class="bg-gray-800 p-3 rounded-lg border border-green-400 cursor-pointer hover:bg-gray-700"
            @click="inspectItemCallback({ type: 'item', data: item })"
         >
            <h4 class="font-bold">{{ item.baseItem.name }}</h4>
            <p class="text-sm text-gray-300 capitalize">{{ item.baseItem.type }}</p>
            <img :src="item.baseItem.icon" class="w-6 h-6 mr-2" />
         </div>
      </div>

      <!-- Stats -->
      <div v-else-if="currentTab === 3" class="grid grid-cols-2 gap-4">
         <div v-for="(value, key) in stats" :key="key" class="bg-gray-800 p-3 rounded-lg">
            <span class="font-semibold capitalize">{{ key }}</span
            >: <span class="text-blue-300">{{ value }}</span>
         </div>
      </div>

      <!-- Spells -->
      <div v-else-if="currentTab === 4" class="grid grid-cols-2 gap-4">
         <div
            v-for="spell in spells"
            :key="spell.id"
            class="bg-gray-800 p-3 rounded-lg border border-purple-400 cursor-pointer hover:bg-gray-700"
            @click="inspectItemCallback({ type: 'spell', data: spell })"
         >
            <h4 class="font-bold text-purple-300">{{ spell.name }}</h4>
            <p class="text-sm text-gray-400 italic">{{ spell.description || 'Nessuna descrizione' }}</p>
            <p class="text-xs mt-1">
               <span class="text-xs text-blue-400">Mana: {{ spell.cost }}</span>
            </p>
         </div>
      </div>

      <!-- Modal di Ispezione -->
      <div v-if="inspectedItem" class="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-6">
         <InspectedItemModal :inspected-item="inspectedItem" :equipped-items="equippedItems" :current-tab="currentTab" @closeInspectModal="closeInspectModal" />
      </div>
   </div>
</template>

<style scoped>
.player-inventory {
   /* border: 2px dashed #ccc; */
   padding: 10px;
   margin: 10px;
   overflow: auto;
   background: #f8f8ff94;
   height: 100%;
}

.tabs button {
   transition: background-color 0.2s ease;
}
</style>
