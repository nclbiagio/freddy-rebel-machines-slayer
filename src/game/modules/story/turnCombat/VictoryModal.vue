<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { EventBus } from '../../../../EventBus';
import { CombatRewardState } from '../../../../models/TurnCombatModel';
import { ItemCatalog } from '../../../../game/data/ItemsAndSpellsCatalog';
import { PlayerStateService } from '../../../state/PlayerState';

const playerState = PlayerStateService.getInstance();

const open = ref(false);
const payload = ref<CombatRewardState>({ victory: false, xp: 0, loot: [] });

const lootItems = computed(() => payload.value.loot.map((id) => ItemCatalog[id]));

const close = () => {
   open.value = false;
   EventBus.emit('trigger-scene');
};

const inventoryQty = (id: string) => {
   const slot = playerState.state.usableItems.find((i) => i.baseItem.key === id);
   return slot?.quantity ?? 1;
};

onMounted(() => {
   EventBus.on('combatReward', (data: CombatRewardState) => {
      payload.value = data;
      open.value = true;
   });
});
</script>

<template>
   <Teleport to="body">
      <div v-if="open" class="overlay" @click.self="close">
         <div class="modal">
            <h2 v-if="payload.victory">🎉 Vittoria!</h2>
            <h2 v-else>💀 Sconfitta</h2>

            <p v-if="payload.victory" class="xp">+{{ payload.xp }} XP</p>

            <div v-if="payload.loot.length">
               <h3>Ricompensa:</h3>
               <ul class="loot">
                  <li v-for="item in lootItems" :key="item.key">
                     <img :src="item.icon" :alt="item.name" />
                     {{ item.name }}
                     <span v-if="item.stackable"> x{{ inventoryQty(item.key) }}</span>
                  </li>
               </ul>
            </div>

            <button class="btn-close" @click="close">Chiudi</button>
         </div>
      </div>
   </Teleport>
</template>

<style scoped>
.overlay {
   position: fixed;
   inset: 0;
   display: flex;
   align-items: center;
   justify-content: center;
   background: rgba(0, 0, 0, 0.6);
   z-index: 9999;
}

.modal {
   background: #222;
   border: 2px solid #555;
   border-radius: 8px;
   padding: 1.5rem 2.5rem;
   color: #fff;
   min-width: 260px;
   box-shadow: 0 4px 12px #000;
   text-align: center;
}

.xp {
   margin: 0.5rem 0 1rem;
   font-weight: bold;
}

.loot {
   list-style: none;
   padding: 0;
}

.loot li {
   margin: 0.3rem 0;
   display: flex;
   align-items: center;
   gap: 0.5rem;
}

.loot img {
   width: 36px;
   height: 36px;
}

.btn-close {
   margin-top: 1.2rem;
   padding: 0.4rem 1.2rem;
   background: #0a84ff;
   border: none;
   border-radius: 4px;
   color: #fff;
   font-size: 1rem;
   cursor: pointer;
}

.btn-close:hover {
   background: #006be6;
}
</style>
