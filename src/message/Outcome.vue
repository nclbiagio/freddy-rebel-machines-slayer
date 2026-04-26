<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { Outcome, SceneReference } from './model';
import { GameSceneTypes } from '../GameService';
import { EventBus } from '../EventBus';
import { MessageUtils } from './Message';

const props = defineProps<{ outcome: Outcome, currentScene: GameSceneTypes | null, canvasWidth: string }>()

const messageUtils = MessageUtils.getInstance();

const visible = ref(false);

const canvasWidthObj = computed(() => {
    if (!props.canvasWidth) return {};
    const widthMatch = props.canvasWidth.match(/width:\s*(\d+)px/);
    if (widthMatch) {
        return { width: `${widthMatch[1]}px` };
    }
    return {};
});

let autoAdvanceTimeoutId: number | null = null;

const outcomeProceed = (outcomeNextSceneId: SceneReference | undefined | null) => {
    const nextSceneId = outcomeNextSceneId;
    if (autoAdvanceTimeoutId) {
        clearTimeout(autoAdvanceTimeoutId);
    }
    if (nextSceneId && nextSceneId?.type === 'scene') {
        EventBus.emit(`trigger-scene`, nextSceneId.id, nextSceneId.msgId)
    } else if (nextSceneId && nextSceneId.type === 'message') {
        messageUtils.openMessage(nextSceneId.id);
    } else {
        console.error('Scene or message id not provided')
    }
}

const setOutcomeAutoAdvanceTimeout = (msgContent: Outcome) => {
    const hasAutoAdvance = msgContent.autoAdvance;
    if (hasAutoAdvance) {
        const autoAdvanceDelay = msgContent.delay;
        const nextSceneId = msgContent.next;
        autoAdvanceTimeoutId = setTimeout(() => {
            outcomeProceed(nextSceneId);
        }, autoAdvanceDelay ?? 15000);
    }
}

onMounted(() => {
    visible.value = true;
    setOutcomeAutoAdvanceTimeout(props.outcome);
});

</script>

<template>
    <transition name="zoom-fade">
        <div class="outcome-fullscreen" v-if="visible">
            <div class="overlay"></div>
            <div class="content" :style="canvasWidthObj">
                <img v-if="outcome.image" :src="outcome.image" class="illustration" />
                <div class="summary">{{ outcome.summary }}</div>
                <button @click="outcomeProceed(outcome.next)" class="next-btn">Continue</button>
            </div>
        </div>
    </transition>
</template>

<style scoped>
.outcome-fullscreen {
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

.overlay {
    position: absolute;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle at center, rgba(0, 0, 0, 0.5), #000);
    z-index: 1;
}

.content {
    z-index: 2;
    text-align: center;
    color: white;
    animation: zoomIn 0.5s ease-out forwards;
    max-width: 100%;
    display: flex;
    justify-content: center;
    flex-direction: column;
    align-items: center;
}

.illustration {
    max-height: 60vh;
    margin-bottom: 1rem;
    object-fit: contain;
    transition: transform 0.4s ease;
}

.summary {
    font-size: 1.6em;
    font-weight: bold;
    text-shadow: 1px 1px 2px #000;
}

.next-btn {
    margin-top: 1rem;
    padding: 0.5rem 1.5rem;
    background: #ffffff20;
    border: 1px solid #fff;
    color: white;
    font-weight: bold;
    border-radius: 6px;
    cursor: pointer;
    max-width: 300px;
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
