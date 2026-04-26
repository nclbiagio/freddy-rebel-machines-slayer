<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { GameService } from '../../GameService';
import { EventBus } from '../../EventBus';


const gameService = GameService.getInstance();
const progress = ref(0);
const showContinueMessage = ref(false);
const imageLogoPath = ref(new URL('/assets/images/logo2.png', import.meta.url).href);

const loadProgress$ = gameService.loadProgress$.subscribe((gsProgress) => {
   progress.value = gsProgress;
   showContinueMessage.value = progress.value >= 100;
});

const keyboardEvent = (event: KeyboardEvent) => {
   if (event.code === 'Enter' && showContinueMessage.value) {
      EventBus.emit('load-assets-complete');
   }
}

const mouseClickEvent = () => {
   if (showContinueMessage.value) {
      EventBus.emit('load-assets-complete');
   }
}

onMounted(() => {
   document.addEventListener('keyup', keyboardEvent);
   document.addEventListener('click', mouseClickEvent);
})

onUnmounted(() => {
   if (loadProgress$) loadProgress$.unsubscribe()
   document.removeEventListener('keyup', keyboardEvent);
   document.removeEventListener('click', mouseClickEvent);
});


</script>

<template>
   <div class="load-assets flex items-center justify-center flex-col w-full h-full cursor-pointer">
      <div class="img-container" style="max-height: 60%;">
         <img :src="imageLogoPath" style="height: 100%;" />
      </div>
      <div class="load-progress">
         <div class="progress">
            <h1>{{ progress }}&#x00025;</h1>
         </div>
      </div>
      <div v-bind:hidden="!showContinueMessage" class="message mt-4">
         Click or press enter to continue...
      </div>
   </div>
</template>

<style scoped>
.img-container {
   animation: fadeIn 1.5s ease-out;
}

.load-progress {
   background-color: #6c6ca6bd;
   padding: 20px;
}

.progress h1 {
   color: #fff;
   font-size: 60px;
}

.message {
   color: #fff;
   animation: flash 1s infinite;
}

@keyframes fadeIn {
   from {
      opacity: 0;
   }

   to {
      opacity: 1;
   }
}

@keyframes flash {

   0%,
   100% {
      opacity: 1;
   }

   50% {
      opacity: 0.4;
   }
}
</style>
