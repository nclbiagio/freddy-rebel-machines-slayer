<script setup lang="ts">
import { computed } from 'vue';
import { EquippedItems, InventoryItem } from '../../models/EquipmentAndStats';

const props = defineProps<{ equippedItems: EquippedItems }>();

const emit = defineEmits(['inspectEquippedItem']);

const inspectEquippedItem = (item: InventoryItem) => {
   emit('inspectEquippedItem', { type: 'item', data: item });
};

const hasEquippedItems = computed(() => !!props.equippedItems.armor || !!props.equippedItems.primaryWeapon || props.equippedItems.accessories.length > 0);
</script>

<template>
   <!-- Armor -->
   <div
      v-if="equippedItems.armor"
      @click="inspectEquippedItem(equippedItems.armor)"
      class="bg-gray-800 p-3 rounded-lg border border-blue-400 cursor-pointer hover:bg-gray-700"
   >
      <h4 class="font-bold">Armatura</h4>
      <p>{{ equippedItems.armor.baseItem.name }}</p>
   </div>

   <!-- Primary Weapon -->
   <div
      v-if="equippedItems.primaryWeapon"
      @click="inspectEquippedItem(equippedItems.primaryWeapon)"
      class="bg-gray-800 p-3 rounded-lg border border-red-400 cursor-pointer hover:bg-gray-700"
   >
      <h4 class="font-bold">Arma Primaria</h4>
      <p>{{ equippedItems.primaryWeapon.baseItem.name }}</p>
   </div>

   <!-- Accessories -->
   <div
      v-for="(accessory, index) in equippedItems.accessories"
      :key="accessory.id"
      @click="inspectEquippedItem(accessory)"
      class="bg-gray-800 p-3 rounded-lg border border-yellow-400 cursor-pointer hover:bg-gray-700"
   >
      <h4 class="font-bold">Accessorio {{ index + 1 }}</h4>
      <p>{{ accessory.baseItem.name }}</p>
   </div>

   <!-- Placeholder se nessun equipaggiamento -->
   <div v-if="!hasEquippedItems" class="col-span-2 text-center text-gray-500 italic">Nessun oggetto equipaggiato.</div>
</template>

<style scoped>
.read-the-docs {
   color: #888;
}
</style>
