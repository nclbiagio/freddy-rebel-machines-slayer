<script setup lang="ts">
import { EventBus } from '../../EventBus';
import { onMounted } from 'vue';

const restartGame = () => {
   EventBus.emit('restart-game');
};

onMounted(() => {
   //TODO add score
});
</script>

<template>
   <div class="gameOver relative flex flex-col w-full h-full items-center justify-center">
      <h1 class="title">Game Over</h1>

      <div class="mt-2 flex justify-center">
         <button
            v-on:click="restartGame()"
            class="msg-btn focus-ring relative flex items-center justify-center px-5 py-2.5 bg-sky-600 text-white hover:bg-sky-600/80"
            type="button"
         >
            Try Again
         </button>
      </div>
   </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Silkscreen:wght@400;700&display=swap');

.gameOver {
   background: rgba(0, 0, 0, 0.4); /* Sfondo semi-trasparente per vedere i cavi dietro */
   z-index: 100;
}

.title {
   font-family: 'Press Start 2P', cursive;
   font-size: 70px;
   color: #ff8c00;
   text-shadow: 
        4px 4px 0px #8b4513, 
        8px 8px 0px rgba(0,0,0,0.8);
   margin-bottom: 40px;
   text-align: center;
   text-transform: uppercase;
   letter-spacing: -4px;
}

.msg-btn {
   font-family: 'Silkscreen', sans-serif;
   font-size: 18px;
   font-weight: 700;
   letter-spacing: 2px;
   text-transform: uppercase;
   border: 4px solid #ff8c00;
   background: #000;
   color: #ff8c00;
   transition: all 0.2s ease;
}

.msg-btn:hover {
   background: #ff8c00;
   color: #000;
   transform: scale(1.1);
}
</style>
