<script setup lang="ts">
import { computed } from 'vue';
import { GameService } from '../GameService';
import { EventBus } from '../EventBus';

const props = defineProps<{
   currentScene: string | null;
}>();

const gameService = GameService.getInstance();

// Mostriamo il tasto solo se siamo in un livello effettivo
const showRestart = computed(() => {
   return props.currentScene && props.currentScene.includes('Level');
});

const restartLevel = () => {
   console.log('[RestartLevel] Emitting restart-level event');
   EventBus.emit('restart-level');
};
</script>

<template>
   <Transition name="fade">
      <div v-if="showRestart" class="restart-container">
         <button class="restart-button" title="Ricomincia Livello" @click="restartLevel">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
               <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
               <path d="M21 3v5h-5"></path>
               <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
               <path d="M3 21v-5h5"></path>
            </svg>
            <span class="label">RESTART</span>
         </button>
      </div>
   </Transition>
</template>

<style scoped>
.restart-container {
   position: fixed;
   top: 20px;
   right: 80px; 
   z-index: 99999; /* Boosted to be above everything */
   pointer-events: auto; /* Ensure it receives clicks */
}

.restart-button {
   background: rgba(20, 20, 25, 0.85);
   backdrop-filter: blur(8px);
   border: 1px solid rgba(255, 255, 255, 0.15);
   color: #ffffff;
   display: flex;
   align-items: center;
   gap: 10px;
   padding: 10px 16px;
   border-radius: 12px;
   cursor: pointer; /* Explicit pointer */
   pointer-events: auto; /* Safety double-check */
   transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
   box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
   font-family: 'Outfit', sans-serif;
   font-weight: 700;
   letter-spacing: 0.5px;
}

.restart-button:hover {
   background: rgba(40, 40, 50, 0.95);
   transform: translateY(-2px) scale(1.05);
   border-color: rgba(0, 255, 255, 0.5);
   box-shadow: 0 8px 25px rgba(0, 255, 255, 0.2);
}

.restart-button:hover svg {
   transform: rotate(-180deg);
}

.restart-button:active {
   transform: translateY(0) scale(0.95);
}

.restart-button svg {
   transition: transform 0.5s ease;
   color: #00ffff; /* Colore tema tech */
}

.label {
   font-size: 12px;
}

/* Animations */
.fade-enter-active,
.fade-leave-active {
   transition: opacity 0.5s ease, transform 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
   opacity: 0;
   transform: translateY(-10px);
}

@media (max-width: 768px) {
   .restart-button .label {
      display: none;
   }
   .restart-button {
      padding: 12px;
      border-radius: 50%;
   }
}
</style>
