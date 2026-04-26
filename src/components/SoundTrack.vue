<script setup lang="ts">
import { ref } from 'vue'
import { GameService } from '../GameService';
import { onMounted } from 'vue';
import { onUnmounted } from 'vue';
import { EventBus } from '../EventBus';

const props = defineProps<{ currentScene: string | null }>()

const gameService = GameService.getInstance();
const checked = ref(false);

const waitDelay = 200;
const audioIconVisible = ref(false);


const musicIsPlaying = gameService.musicIsPlaying$.subscribe((isPlaying) => {
    checked.value = isPlaying;
});

const toggle = () => {
    if (!props.currentScene) return;
    
    if (checked.value) {
        EventBus.emit(`stop-sound-${props.currentScene}`);
    } else {
        EventBus.emit(`play-sound-${props.currentScene}`);
    }
}

onMounted(() => {
    setTimeout(() => {
        audioIconVisible.value = true;
    }, waitDelay);
})

onUnmounted(() => {
    if (musicIsPlaying) {
        musicIsPlaying.unsubscribe()
    }
})

</script>

<template>
    <div class="soundtrack bottom-4 right-4">
        <div class="mt-2 flex flex-row items-center">
            <div class="mr-2" :class="{ invisible: !audioIconVisible }" v-on:click="toggle()">
                <span v-if="checked" class="audio-icon material-symbols-outlined cursor-pointer"> volume_up </span>
                <span v-if="!checked" class="audio-icon material-symbols-outlined cursor-pointer"> volume_off </span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.soundtrack {
    position: fixed;
    z-index: 50000;
    overflow: hidden;
    pointer-events: auto;
}

.audio-icon {
    color: white;
    font-size: 80px;
}

.material-symbols-outlined {
    font-variation-settings:
        'FILL' 0,
        'wght' 400,
        'GRAD' 0,
        'opsz' 24;
}
</style>
