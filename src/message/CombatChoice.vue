<script setup lang="ts">
import { EventBus } from '../EventBus';
import { GameSceneTypes } from '../GameService';
import { MessageUtils } from './Message';
import { CombatChoice, CombatChoiceOption } from './model';

defineProps<{ combatChoice: CombatChoice, currentScene: GameSceneTypes | null }>()

const messageUtils = MessageUtils.getInstance();

const handleCombatChoice = (choice: CombatChoiceOption) => {
    if (choice.onChosen) {
        choice.onChosen()
    }

    if (choice.next && choice.next.type === 'message') {
        messageUtils.openMessage(choice.next.id);
    } else if (choice.next.type === 'scene') {
        EventBus.emit(`trigger-scene`, choice.next.id)
    }
}

</script>

<template>
    <div class="combat-choice bg-black bg-opacity-70 text-white p-4 rounded-xl shadow-xl">
        <h2 class="text-2xl font-bold mb-2">Nemico: {{ combatChoice.enemy }}</h2>
        <p class="mb-4">{{ combatChoice.description }}</p>

        <div v-for="(choice, index) in combatChoice.choices" :key="index" class="mb-2">
            <button class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg"
                @click="handleCombatChoice(choice)">
                {{ choice.text }}
            </button>
        </div>
    </div>
</template>

<style scoped>
.combat-choice {
    animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: scale(0.95);
    }

    to {
        opacity: 1;
        transform: scale(1);
    }
}
</style>
