<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { EventBus } from '../../../EventBus';

defineProps<{ canvasWidth: string }>();

interface Confetti {
   id: number;
   x: number;
   y: number;
   color: string;
   size: number;
   duration: number;
   delay: number;
   rotation: number;
   targetX: number;
   targetY: number;
}

const confettiList = ref<Confetti[]>([]);
const colors = ['#ff8c00', '#ffd700', '#00ffff', '#ffffff', '#ff4500'];

const createConfetti = () => {
   const count = 60;
   const temp: Confetti[] = [];
   for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = 100 + Math.random() * 200;
      temp.push({
         id: i,
         x: 50, // center %
         y: 50, // center %
         color: colors[Math.floor(Math.random() * colors.length)],
         size: 5 + Math.random() * 10,
         duration: 2 + Math.random() * 2,
         delay: Math.random() * 0.2,
         rotation: Math.random() * 360,
         targetX: 50 + Math.cos(angle) * (20 + Math.random() * 40),
         targetY: 50 + Math.sin(angle) * (20 + Math.random() * 40) + 20, // add gravity effect
      });
   }
   confettiList.value = temp;
};

onMounted(() => {
   EventBus.emit('level-complete:mounted');
   createConfetti();
});

const onContinue = () => {
   console.log('Continue clicked');
   EventBus.emit('level-complete:continue');
};
</script>

<template>
   <div class="level-complete-container" :style="canvasWidth">
      <!-- Confetti Layer -->
      <div class="confetti-wrapper">
         <div 
            v-for="c in confettiList" 
            :key="c.id" 
            class="confetti" 
            :style="{
               '--color': c.color,
               '--size': `${c.size}px`,
               '--duration': `${c.duration}s`,
               '--delay': `${c.delay}s`,
               '--rotation': `${c.rotation}deg`,
               '--target-x': `${c.targetX}%`,
               '--target-y': `${c.targetY}%`,
               left: `${c.x}%`,
               top: `${c.y}%`
            }"
         ></div>
      </div>

      <div class="panel">
         <h1 class="victory-title">Mission Accomplished</h1>
         <button class="btn-continue" @click="onContinue">Continue</button>
      </div>
   </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

.level-complete-container {
   margin: 0 auto; 
   position: absolute;
   top: 0;
   left: 0;
   right: 0; 
   height: 100%;
   background: rgba(0, 0, 0, 0.6); 
   backdrop-filter: blur(12px);
   display: flex;
   justify-content: center;
   align-items: center;
   z-index: 20000;
   pointer-events: auto;
   overflow: hidden; /* Prevent confetti from showing outside */
}

.confetti-wrapper {
   position: absolute;
   width: 100%;
   height: 100%;
   pointer-events: none;
}

.confetti {
   position: absolute;
   width: var(--size);
   height: var(--size);
   background: var(--color);
   border-radius: 2px;
   opacity: 0;
   animation: confetti-burst var(--duration) cubic-bezier(0.25, 0.46, 0.45, 0.94) var(--delay) forwards;
}

@keyframes confetti-burst {
   0% {
      transform: translate(-50%, -50%) rotate(0deg) scale(0);
      opacity: 1;
   }
   20% {
      opacity: 1;
      transform: translate(-50%, -50%) rotate(var(--rotation)) scale(1);
   }
   100% {
      left: var(--target-x);
      top: var(--target-y);
      transform: translate(-50%, -50%) rotate(calc(var(--rotation) + 360deg)) scale(0.5);
      opacity: 0;
   }
}

.panel {
   position: relative; /* Ensure it stays above confetti background */
   background: rgba(15, 15, 20, 0.95);
   border: 2px solid #333;
   padding: 60px 80px;
   text-align: center;
   border-radius: 16px;
   box-shadow: 0 0 50px rgba(0, 0, 0, 0.9);
   min-width: 400px;
   display: flex;
   flex-direction: column;
   align-items: center;
   gap: 40px;
   animation: panel-pop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

@keyframes panel-pop {
   from { transform: scale(0.8); opacity: 0; }
   to { transform: scale(1); opacity: 1; }
}

.victory-title {
   font-family: 'Press Start 2P', cursive;
   font-size: 32px;
   color: #ff8c00;
   text-transform: uppercase;
   line-height: 1.4;
   text-shadow: 
        3px 3px 0px #8b4513, 
        6px 6px 0px rgba(0,0,0,0.5);
   margin: 0;
}

.btn-continue {
   padding: 16px 40px;
   font-family: 'Press Start 2P', cursive;
   font-size: 14px;
   background: #333;
   color: white;
   border: 2px solid #555;
   cursor: pointer;
   transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
   text-shadow: 1px 1px 0 #000;
   text-transform: uppercase;
}

.btn-continue:hover {
   background: #ff8c00;
   border-color: #fff;
   color: #000;
   transform: scale(1.1);
   box-shadow: 0 0 30px rgba(255, 140, 0, 0.4);
}

.btn-continue:active {
   transform: scale(0.95);
}
</style>
