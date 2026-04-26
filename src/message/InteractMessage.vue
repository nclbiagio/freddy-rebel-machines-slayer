<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { MessageUtils } from './Message';
import { InteractMessageModel } from './model';
import { EventBus } from '../EventBus';

const messageUtils = MessageUtils.getInstance();
const messages = ref<InteractMessageModel[]>([]);

onMounted(() => {
   const subscription = messageUtils.interactMessages$.subscribe((msgs) => {
      messages.value = msgs;
   });

   window.addEventListener('keydown', handleKeydown);

   onUnmounted(() => {
      subscription.unsubscribe();
      window.removeEventListener('keydown', handleKeydown);
   });
});

const handleKeydown = (e: KeyboardEvent) => {
   messages.value.forEach((msg) => {
      if (e.key.toLowerCase() === msg.closeKey.toLowerCase()) {
         // Emit event to Game
         EventBus.emit('interaction-triggered', { id: msg.id, key: msg.closeKey });
      }
   });
};
</script>

<template>
   <div class="interact-messages-container">
      <div v-for="msg in messages" :key="msg.id" class="interact-message">
         <div class="key-icon">{{ msg.closeKey }}</div>
         <span v-if="msg.message" class="message-text">{{ msg.message }}</span>
      </div>
   </div>
</template>

<style scoped>
.interact-messages-container {
   position: absolute;
   top: 0;
   left: 0;
   width: 100%;
   height: 100%;
   pointer-events: none;
   z-index: 9999;
   display: flex;
   justify-content: center;
   align-items: center;
}

.interact-message {
   position: absolute; /* Ideally positioned by World Coordinates, but for now centered or fixed? 
                       Wait, the prompt should be ON the entity. 
                       Since we don't have screen coordinates readily available here without mapping, 
                       maybe we just show it at bottom center or verify requirement. 
                       "Graficamente dei cloni dei flyMessages" -> FlyMessages are usually fixed or floating. 
                       The USER said "graphical clones of flyMessages". 
                       BUT Interact Prompts usually track entity. 
                       
                       Simplification: We show them at bottom-center or a specific dedicated area for "Available Interaction".
                       OR we need to update coordinates from Phaser loop. 
                       
                       Let's start with a fixed position (e.g. bottom center) which is common for "Press E to Interact". */
   bottom: 20%;
   left: 50%;
   transform: translateX(-50%);

   background-color: rgba(0, 0, 0, 0.8);
   border: 1px solid rgba(255, 255, 255, 0.3);
   border-radius: 8px;
   padding: 8px 16px;
   display: flex;
   align-items: center;
   gap: 12px;
   box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
   animation: fadeIn 0.2s ease-out;
}

.key-icon {
   width: 24px;
   height: 24px;
   background: #fff;
   color: #000;
   border-radius: 4px;
   font-weight: bold;
   display: flex;
   align-items: center;
   justify-content: center;
   font-size: 14px;
   box-shadow: 0 2px 0 #ccc;
}

.message-text {
   color: white;
   font-size: 16px;
   letter-spacing: 0.5px;
}

@keyframes fadeIn {
   from {
      opacity: 0;
      transform: translate(-50%, 10px);
   }
   to {
      opacity: 1;
      transform: translate(-50%, 0);
   }
}
</style>
