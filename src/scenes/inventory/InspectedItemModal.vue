<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { EquippedItems, InventoryItem, Item, ItemStats, Spell } from '../../models/EquipmentAndStats';
import { PlayerStateService } from '../../game/state/PlayerState';
import { InspectedItem } from './model';

const props = defineProps<{ inspectedItem: InspectedItem; equippedItems: EquippedItems; currentTab: number }>();

const displayItem = computed(() => {
   if (props.inspectedItem?.type === 'item') {
      return getBaseItem(props.inspectedItem.data);
   }
   return null;
});

const emit = defineEmits(['closeInspectModal']);

const playerState = PlayerStateService.getInstance();

const closeModal = (data?: { updateUi?: boolean }) => {
   emit('closeInspectModal', data?.updateUi);
};

const equippedItemToCompare = ref<InventoryItem | null>(null);

const getEquippedItemToCompare = () => {
   if (props.inspectedItem?.type === 'item') {
      // inspectedItem.data is InventoryItem (mostly) or Item. Normalize?
      // Since we updated Inventory.vue to pass InventoryItem, data is InventoryItem.
      const itemData = props.inspectedItem.data;
      const base = getBaseItem(itemData);

      if (base.type === 'weapon') {
         return props.equippedItems.primaryWeapon;
      }
      if (base.type === 'armor') {
         return props.equippedItems.armor;
      }
   }
   return null;
};

const isUsable = (item: Item | InventoryItem) => {
   const base = getBaseItem(item);
   return base.type.includes('potion') || base.type.includes('consumable');
};

const useItem = (item: Item | InventoryItem) => {
   const base = getBaseItem(item);
   console.log('Used:', base.name);
   // Must be InventoryItem to use (needs ID). Cast or ensure caller passes InventoryItem
   if ('baseItem' in item) {
      playerState.useItem(item);
      closeModal({ updateUi: true });
   }
};

const equipItem = (item: Item | InventoryItem) => {
   const base = getBaseItem(item);
   console.log('Equipped:', base.name);
   playerState.equipItem(item);
   closeModal({ updateUi: true });
};

const isItemEquipped = (item: Item | InventoryItem): boolean => {
   const currentEquippedItems = playerState.state.equippedItems;
   const base = getBaseItem(item);

   // Check UUID if available (InventoryItem) for exact match
   if ('baseItem' in item) {
      // InventoryItem
      return (
         currentEquippedItems.armor?.id === item.id ||
         currentEquippedItems.primaryWeapon?.id === item.id ||
         currentEquippedItems.accessories.some((a) => a.id === item.id)
      );
   }
   // Fallback checking Key if just Item (Catalog) - though strictly inventory uses instances
   return (
      currentEquippedItems.armor?.baseItem.key === item.key ||
      currentEquippedItems.primaryWeapon?.baseItem.key === item.key ||
      currentEquippedItems.accessories.some((a) => a.baseItem.key === item.key)
   );
};

const unequipItem = (item: Item | InventoryItem) => {
   if ('baseItem' in item) {
      playerState.unequipItem(item);
      closeModal({ updateUi: true });
   }
};

const equipSpell = (spell: Spell) => {
   console.log('Equipped:', spell.name);
   // Esegui la logica per equipaggiare la magia
   closeModal({ updateUi: true });
};

const getBaseItem = (item: Item | InventoryItem): Item => {
   return 'baseItem' in item ? item.baseItem : item;
};

const compareItemsStats = (newItem: Item | InventoryItem, currentItem?: Item | InventoryItem): { stat: string; diff: number }[] => {
   const result: { stat: string; diff: number }[] = [];
   const newBase = getBaseItem(newItem);
   const currentBase = currentItem ? getBaseItem(currentItem) : undefined;

   const allStats = new Set([...Object.keys(newBase.stats || {}), ...Object.keys(currentBase?.stats || {})]);

   allStats.forEach((stat) => {
      const statProp = stat as keyof ItemStats;
      const newVal = newBase.stats?.[statProp] || 0;
      const currentVal = currentBase?.stats?.[statProp] || 0;
      result.push({ stat, diff: newVal - currentVal });
   });

   return result;
};

onMounted(() => {
   if (props.currentTab === 2) {
      equippedItemToCompare.value = getEquippedItemToCompare();
   }
});
</script>

<template>
   <div v-if="inspectedItem" class="bg-gray-800 text-white p-6 rounded-xl w-full shadow-xl relative">
      <button @click="closeModal()" class="absolute top-2 right-3 text-gray-400 hover:text-white text-lg">✕</button>

      <div v-if="inspectedItem.type === 'item' && displayItem">
         <h3 class="text-xl font-bold mb-2">{{ displayItem.name }}</h3>
         <p class="text-sm text-gray-300">Tipo: {{ displayItem.type }}</p>
         <div v-if="inspectedItem && inspectedItem.data && equippedItemToCompare">
            <h3 class="text-sm font-bold mt-4 mb-2">Differenze Statistiche</h3>
            <ul>
               <li
                  v-for="comparison in compareItemsStats(inspectedItem?.data, equippedItemToCompare)"
                  :key="comparison.stat"
                  :class="{
                     'text-green-500': comparison.diff > 0,
                     'text-red-500': comparison.diff < 0,
                     'text-gray-500': comparison.diff === 0,
                  }"
               >
                  {{ comparison.stat }}:
                  <span> {{ comparison.diff > 0 ? '+' : '' }}{{ comparison.diff }} </span>
               </li>
            </ul>
         </div>
         <div class="mt-4 flex justify-end space-x-2">
            <button v-if="isUsable(inspectedItem.data)" class="px-4 py-2 bg-green-600 rounded hover:bg-green-700" @click="useItem(inspectedItem.data)">
               Usa
            </button>
            <button
               v-else-if="!isItemEquipped(inspectedItem.data)"
               class="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
               @click="equipItem(inspectedItem.data)"
            >
               Equipaggia
            </button>
            <button v-if="isItemEquipped(inspectedItem.data)" class="px-4 py-2 bg-red-600 rounded hover:bg-red-700" @click="unequipItem(inspectedItem.data)">
               Rimuovi
            </button>
         </div>
      </div>

      <div v-else-if="inspectedItem.type === 'spell'">
         <h3 class="text-xl font-bold text-purple-300 mb-2">{{ inspectedItem.data.name }}</h3>
         <p class="text-sm text-gray-400 italic mb-2">
            {{ inspectedItem.data.description || 'Nessuna descrizione' }}
         </p>
         <p class="text-sm text-blue-400">Costo Mana: {{ inspectedItem.data.cost }}</p>
         <div class="flex justify-end">
            <button class="px-4 py-2 bg-purple-600 rounded hover:bg-purple-700" @click="equipSpell(inspectedItem.data)">Equipaggia</button>
         </div>
      </div>
   </div>
</template>

<style scoped></style>
