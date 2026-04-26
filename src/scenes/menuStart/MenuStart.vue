<script setup lang="ts">
import { ref } from 'vue';
import { EventBus } from '../../EventBus';
import FreddyTitle from '../../components/FreddyTitle.vue';

withDefaults(
   defineProps<{
      canvasWidth: string;
      showAnimatedTitle?: boolean;
   }>(),
   {
      showAnimatedTitle: false,
   }
);

const imageMenuPath = ref(new URL('/assets/images/gameLogo.png', import.meta.url).href);

const playGame = () => {
   EventBus.emit('play-game');
};
</script>

<template>
   <div
      class="game-menu flex items-center flex-col w-full h-full"
      :class="{ 'justify-center bg-slate-900': showAnimatedTitle, 'justify-end': !showAnimatedTitle }"
      :style="!showAnimatedTitle ? { 'background-image': `url(${imageMenuPath})` } : {}"
   >
      <div v-if="showAnimatedTitle" class="title-wrapper mb-8">
         <FreddyTitle />
      </div>

      <div
         class="instructions-container flex flex-col items-center justify-center w-full pb-12"
         :class="{ 'bg-black/40 backdrop-blur-sm': !showAnimatedTitle }"
      >
         <div class="flex flex-col items-center mt-4 max-w-lg text-center">
            <p class="italic text-sky-200 text-lg leading-relaxed px-4">
               "The rebellion? It was just another walk in the park."
            </p>
            <span class="mt-2 text-sky-400 font-bold tracking-widest uppercase text-sm"> — F. </span>
         </div>
         <div class="mt-4 flex justify-center">
            <button
               v-on:click="playGame()"
               class="focus-ring relative flex items-center justify-center px-10 py-3 bg-sky-600 text-white hover:bg-sky-500 transition-colors font-bold rounded"
               type="button"
            >
               Start
            </button>
         </div>
      </div>
   </div>
</template>

<style scoped>
.game-menu {
   background-size: contain;
   background-repeat: no-repeat;
   background-position: center;
   animation: fadeIn 1.2s ease-out;
}

.instructions-container {
   line-height: 22px;
   font-size: 14px;
   color: #94a3b8; /* slate-400 */
   text-align: center;
}

@keyframes fadeIn {
   from {
      opacity: 0;
   }
   to {
      opacity: 1;
   }
}
</style>
