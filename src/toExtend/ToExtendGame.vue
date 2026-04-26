<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { GameSceneTypes } from '../GameService';
/**
 * Extended scene here, remove it on new games
 */
import { Subscription } from 'rxjs';
import { FlyMessageModel, FlyMessagesType, InteractMessageModel } from '../message/model';
import { MessageUtils } from '../message/Message';
import FlyMessage from '../message/FlyMessage.vue';
import InteractMessage from '../message/InteractMessage.vue';
import LevelComplete from './scenes/levelComplete/LevelComplete.vue'; // Added import

const props = defineProps<{ currentScene: GameSceneTypes | null; canvasWidth: string; isGameScene: boolean }>();

const messageUtils = MessageUtils.getInstance();

let flyMessagesSub: Subscription | null = null;
let interactMessagesSub: Subscription | null = null;
const flyMessagesType: FlyMessagesType = 'scene_';
const sceneMessages = ref<FlyMessageModel[]>([]);
const interactMessages = ref<InteractMessageModel[]>([]);

onMounted(() => {
   flyMessagesSub = messageUtils.flyMessages$.subscribe((msgs) => {
      sceneMessages.value = msgs.filter((msg) => msg.key.includes(flyMessagesType));
   });
   interactMessagesSub = messageUtils.interactMessages$.subscribe((msgs) => {
      interactMessages.value = msgs;
   });
});

onUnmounted(() => {
   if (flyMessagesSub) {
      flyMessagesSub.unsubscribe();
   }
   if (interactMessagesSub) {
      interactMessagesSub.unsubscribe();
   }
});
</script>

<template>
   <LevelComplete v-if="currentScene === 'LevelComplete'" :canvas-width="props.canvasWidth" />

   <FlyMessage :messages="sceneMessages" :duration="3500" />
   <InteractMessage :messages="interactMessages" />
</template>
