<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { FlyMessageModel } from './model';
import { MessageUtils } from './Message';
import { GameService } from '../GameService';

interface FlyMessage extends FlyMessageModel {
   id: number;
}

const props = defineProps<{
   messages: FlyMessageModel[];
   duration?: number;
}>();

const gameService = GameService.getInstance();

const messageUtils = MessageUtils.getInstance();
const currentMessage = ref<FlyMessage | null>(null);
const queue = ref<FlyMessageModel[]>([]);

const msgType = computed(() => {
   if (currentMessage.value?.key.includes('scene_')) {
      return 'isScene';
   }
   if (currentMessage.value?.key.includes('utils_')) {
      return 'isUtils';
   }
   if (currentMessage.value?.key.includes('error_')) {
      return 'isError';
   }
});
let idCounter = 0;
let isProcessing = false;

watch(
   () => props.messages,
   (newMsgs, oldMsgs) => {
      // se ci sono nuovi messaggi, mostriamoli
      if (newMsgs.length > oldMsgs.length) {
         const newItems = newMsgs.slice(oldMsgs.length);
         queue.value.push(...newItems);
         processQueue(); // avvia la coda se non già in corso
      }
   }
);

async function processQueue() {
   if (isProcessing) return;
   isProcessing = true;

   while (queue.value.length > 0) {
      const msg = queue.value.shift()!;
      const id = ++idCounter;
      currentMessage.value = { id, key: msg.key, text: msg.text, duration: msg.duration };

      // aspetta la durata prima di togliere il messaggio
      await new Promise((resolve) => setTimeout(resolve, msg.duration ?? props.duration ?? 3000));

      messageUtils.removeFlyMessage(msg.key);
      currentMessage.value = null;

      // aspetta che finisca la transizione di uscita (0.5s)
      await new Promise((resolve) => setTimeout(resolve, 500));
   }

   isProcessing = false;
}
</script>

<template>
   <div class="fly-message-wrapper">
      <transition name="fade">
         <div v-if="currentMessage" :key="currentMessage.id" class="message-box" :class="[msgType]">
            <span v-if="gameService.debug">[{{ currentMessage.key }}] <br /></span>
            {{ currentMessage.text }}
         </div>
      </transition>
   </div>
</template>

<style scoped>
.fly-message-wrapper {
   position: fixed;
   bottom: 40px;
   left: 50%;
   transform: translateX(-50%);
   display: flex;
   flex-direction: column;
   gap: 8px;
   align-items: center;
   z-index: 9999;
   min-width: 600px;
   max-width: 800px;
   width: 100%;
   pointer-events: none;
}

.message-box {
   pointer-events: auto;
   color: #fdfdfd;
   padding: 16px 24px;
   border-radius: 16px;
   box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
   font-size: 1.1rem;
   user-select: none;
   backdrop-filter: blur(5px);
   text-align: center;
   line-height: 22px;
}

.message-box.isScene {
   background: rgb(25 25 35 / 64%);
}

.message-box.isUtils {
   background: rgba(103, 103, 231, 0.64);
}

.message-box.isError {
   background: rgba(217, 71, 83, 0.64);
}

/* animazioni */
.fade-enter-active,
.fade-leave-active {
   transition: all 0.5s ease;
}
.fade-enter-from {
   opacity: 0;
   transform: translateY(20px) scale(0.95);
}
.fade-enter-to {
   opacity: 1;
   transform: translateY(0) scale(1);
}
.fade-leave-from {
   opacity: 1;
   transform: translateY(0) scale(1);
}
.fade-leave-to {
   opacity: 0;
   transform: translateY(-20px) scale(0.95);
}
</style>
