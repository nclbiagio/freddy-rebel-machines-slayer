<script setup lang="ts">
import { onMounted, reactive, ref, computed } from 'vue';
import { Caption, ImagesConfig } from './model';
import { GameSceneTypes } from '../GameService';

const props = defineProps<{ caption: Caption; currentScene: GameSceneTypes | null; canvasWidth: string; imgsConfig?: ImagesConfig }>();

const styleImage = reactive({
   'max-height': '',
});

const visible = ref(false);

const canvasWidthObj = computed(() => {
   if (!props.canvasWidth) return {};
   const widthMatch = props.canvasWidth.match(/width:\s*(\d+)px/);
   if (widthMatch) {
      return { width: `${widthMatch[1]}px` };
   }
   return {};
});

onMounted(() => {
   visible.value = true;
   styleImage['max-height'] = props.imgsConfig ? `${props.imgsConfig.maxHeightVh}vh` : '50vh';
});
</script>

<template>
   <transition name="zoom-fade">
      <div class="caption-fullscreen cursor-pointer" v-if="visible">
         <div class="content" :style="canvasWidthObj">
            <img v-if="caption.image" :src="caption.image" class="illustration" :style="[styleImage]" />
            <p class="caption">{{ caption.text }}</p>
            <slot> skip icon </slot>
         </div>
      </div>
   </transition>
</template>

<style scoped>
.caption-fullscreen {
   position: fixed;
   top: 0;
   left: 0;
   width: 100vw;
   height: 100vh;
   z-index: 9999;
   display: flex;
   justify-content: center;
   align-items: center;
   background: #000;
   overflow: hidden;
}

.caption {
   color: #ccc;
   line-height: 28px;
}

.illustration {
   /* max-height: 70vh; */
   margin-bottom: 1rem;
   object-fit: contain;
   transition: transform 0.3s ease;
   display: block;
   margin: 0 auto;
   margin-bottom: 16px;
}

/* Animazione d'ingresso */
@keyframes zoomIn {
   from {
      transform: scale(0.8);
      opacity: 0;
   }

   to {
      transform: scale(1);
      opacity: 1;
   }
}

.zoom-fade-enter-active,
.zoom-fade-leave-active {
   transition: opacity 0.3s ease;
}

.zoom-fade-enter-from,
.zoom-fade-leave-to {
   opacity: 0;
}
</style>
