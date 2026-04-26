<script setup lang="ts">
import { ref, onMounted } from 'vue'

const letters = ['F', 'R', 'E', 'D', 'D', 'Y']
const visibleLetters = ref<number[]>([])
const showSubtitle = ref(false)

onMounted(() => {
    letters.forEach((_, index) => {
        setTimeout(() => {
            visibleLetters.value.push(index)
        }, index * 300)
    })

    setTimeout(() => {
        showSubtitle.value = true
    }, letters.length * 300 + 500)
})
</script>

<template>
    <div class="freddy-title-container select-none">
        <div class="letters-row">
            <div 
                v-for="(letter, index) in letters" 
                :key="index"
                class="magnet-letter"
                :class="{ 'is-visible': visibleLetters.includes(index) }"
            >
                <span class="letter-text">{{ letter }}</span>
            </div>
        </div>
        
        <div class="subtitle-container" :class="{ 'is-visible': showSubtitle }">
            <div class="subtitle-bar">
                <span class="subtitle-text">rebel machine slayer</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Silkscreen:wght@400;700&display=swap');

.freddy-title-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    padding: 40px;
}

.letters-row {
    display: flex;
    gap: 15px;
}

.magnet-letter {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transform: translateX(200px) scale(2);
    transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.magnet-letter.is-visible {
    opacity: 1;
    transform: translateX(0) scale(1);
}

.letter-text {
    font-family: 'Press Start 2P', cursive;
    font-size: 80px;
    color: #ff8c00;
    text-shadow: 
        4px 4px 0px #8b4513, 
        8px 8px 0px rgba(0,0,0,0.5);
    z-index: 2;
}

.subtitle-container {
    opacity: 0;
    transform: translateY(30px);
    transition: all 1s ease-out;
    width: 100%;
    display: flex;
    justify-content: center;
    margin-top: -5px;
}

.subtitle-container.is-visible {
    opacity: 1;
    transform: translateY(0);
}

.subtitle-bar {
    background: #000;
    padding: 12px 60px;
    box-shadow: 0 10px 20px rgba(0,0,0,0.8);
}

.subtitle-text {
    font-family: 'Silkscreen', sans-serif;
    font-size: 18px;
    font-weight: 700;
    color: #fff;
    text-transform: uppercase;
    white-space: nowrap;
    display: block;
    letter-spacing: 6px;
}
</style>
