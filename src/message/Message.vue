<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref, computed } from 'vue';
import { MessageUtils } from './Message';
import { Subscription } from 'rxjs';
import { GameService } from '../GameService';
import { Character, ChoiceOption, Message, MessageContent } from './model';
import Outcome from './Outcome.vue';
import Caption from './Caption.vue';
import { EventBus } from '../EventBus';
import CombatChoice from './CombatChoice.vue';

const props = defineProps<{ canvasWidth: string }>();

const iconSkip = ref(new URL('/assets/icons/skip.png', import.meta.url).href);

const gameService = GameService.getInstance();
const sceneContainingDialogues = gameService.type === 'Novel' ? gameService.scene$.getValue() : gameService.prevScene$.getValue();
const messageUtils = MessageUtils.getInstance();

const visible = ref(false);
const message = ref<Message | null>(null);
const messageContent = ref<MessageContent | null>(null);
const messageContentIndex = ref(-1);
const playerCharacter = ref<Character | null>(null);
const messageCharacters = ref<Character[]>([]);
const charactersVisibility = ref(false);

const sceneTransition = ref<'fadeIn' | 'fadeOut' | 'slideUp' | 'none'>('fadeIn');

let selectedMessageId: Subscription | null = null;

const styleBg = reactive({
   'background-image': '',
   'background-repeat': 'no-repeat',
   'background-size': 'cover',
   'background-position': 'center',
   //'background-color': '#faebd77d',
});

const canvasWidthObj = computed(() => {
   if (!props.canvasWidth) return {};
   const widthMatch = props.canvasWidth.match(/width:\s*(\d+)px/);
   if (widthMatch) {
      return { width: `${widthMatch[1]}px` };
   }
   return {};
});

const mergedContainerStyle = computed(() => {
   return { ...styleBg, ...canvasWidthObj.value };
});

const mergedBackgroundStyle = computed(() => {
   return { 
      backgroundImage: message.value?.bgAnimated ? `url(${message.value.background})` : '',
      ...canvasWidthObj.value 
   };
});

const nextMessageContent = () => {
   if (message.value && message.value.content && message.value.content.length > 0) {
      messageContentIndex.value++;
      return message.value.content[messageContentIndex.value];
   } else {
      return null;
   }
};

const handleClickOnMessage = () => {
   if (!messageContent.value || messageContent.value.type === 'choice' || messageContent.value.type === 'outcome') return;

   const nextContentIndex = messageContentIndex.value + 1;

   if (message.value && nextContentIndex < message.value.content.length) {
      messageContent.value = nextMessageContent();
   } else {
      // Se c'è un next, cerca il messaggio nella lista e apri quel messaggio
      if (message.value && message.value.next) {
         if (message.value.next.type === 'message') {
            const msg = findMessage(message.value.next.id);
            if (msg) {
               messageUtils.openMessage(message.value.next.id);
               return;
            }
         } else if (message.value.next.type === 'scene') {
            //Triggeri una nuova scena Phaser
            if (message.value.next.callbackScene) {
               message.value.next.callbackScene();
            }
            EventBus.emit(`trigger-scene`, message.value.next.id);
            return;
         } else {
            console.warn(`Scene type ${message.value.next.type} is not available`);
            return;
         }
      }
      // Altrimenti, cerca il messaggio successivo in sequenza nella scena
      const currentMessageIndex = message.value ? findMessageIndex(message.value.id) : null;
      const messages = messageUtils.getMessagesByScene(sceneContainingDialogues as string);
      const nextInScene = currentMessageIndex ? messages[currentMessageIndex + 1] : null;
      if (nextInScene) {
         messageUtils.openMessage(nextInScene.id);
         return;
      }

      // Oppure triggeri una nuova scena Phaser come fallback finale
      EventBus.emit(`trigger-scene`, 'SceneFallback');
   }
};

const selectChoice = (choice: ChoiceOption) => {
   if (choice.onChosen) {
      choice.onChosen();
   }
   if (choice.next && choice.next.type === 'message') {
      messageUtils.openMessage(choice.next.id);
   } else if (choice.next.type === 'scene') {
      EventBus.emit(`trigger-scene`, choice.next.id);
   }
};

const getSpeakerName = (id: string): string => {
   const chars = message.value?.characters || [];
   const char = chars.find((c) => c.id === id);
   return char?.name ?? char?.id ?? id;
};

const isSpeaking = (charId: string): boolean => {
   return messageContent.value?.type === 'dialogue' && messageContent.value.speaker === charId;
};

const isPlayer = (charId: string): boolean => {
   return message.value?.playerId === charId;
};

const findMessageIndex = (msgId: string) => {
   const messages = messageUtils.getMessagesByScene(sceneContainingDialogues as string);
   if (messages && messages.length > 0) {
      return messages.findIndex((msg) => msg.id === msgId);
   } else {
      console.log(`Messages for the scene '${sceneContainingDialogues}' not defined!`);
   }
};

const findMessage = (msgId: string) => {
   const messages = messageUtils.getMessagesByScene(sceneContainingDialogues as string);
   if (messages && messages.length > 0) {
      const msg = messages.find((msg) => msg.id === msgId);
      return msg;
   } else {
      console.log(`Messages for the scene '${sceneContainingDialogues}' not defined!`);
   }
};

const closeToPrevScene = () => {
   EventBus.emit(`trigger-scene`, sceneContainingDialogues, 'fromCloseX');
};

onMounted(() => {
   selectedMessageId = messageUtils.selectedMessageId$.subscribe((msgId) => {
      if (msgId) {
         const msg = findMessage(msgId);
         if (msg) {
            if (messageContentIndex.value >= 0) {
               messageContentIndex.value = -1;
            }
            message.value = msg;
            messageContent.value = nextMessageContent();

            playerCharacter.value = msg.characters?.find((char) => isPlayer(char.id)) || null;
            messageCharacters.value = msg.characters?.filter((char) => !isPlayer(char.id)) || [];
            visible.value = true;
            sceneTransition.value = msg.transition || 'none';
            setTimeout(() => {
               styleBg['background-image'] = msg.background && !msg.bgAnimated ? `url('${msg.background}')` : '';
               charactersVisibility.value = true;
            }, 100);
            //console.log(messageContent.value && visible.value)
         }
      } else {
         visible.value = false;
      }
      console.log(msgId);
   });
});

onUnmounted(() => {
   if (selectedMessageId) {
      selectedMessageId.unsubscribe();
   }
});
</script>

<template>
   <div class="relative w-full h-full" :style="mergedContainerStyle">
      <!-- Sfondo Animato -->
      <transition name="fadeIn">
         <div v-if="message?.bgAnimated" 
              class="background-animated" 
              :style="[mergedBackgroundStyle, { '--frames': message.frames || 8, '--steps': (message.frames || 8) - 1 }]">
         </div>
      </transition>
      <button v-if="messageUtils.showCloseIcon" @click="closeToPrevScene" class="absolute top-2 right-3 text-gray-400 hover:text-white text-lg">✕</button>
      <!-- Personaggi -->
      <transition name="fadeIn">
         <div class="characters" v-if="charactersVisibility">
            <div class="player" v-if="playerCharacter">
               <div v-if="playerCharacter.animated" 
                    :class="['character-animated', { active: isSpeaking(playerCharacter.id) }]"
                    :style="{ backgroundImage: `url(${playerCharacter.image})`, '--frames': playerCharacter.frames || 8, '--steps': (playerCharacter.frames || 8) - 1 }">
               </div>
               <img v-else-if="playerCharacter.image" :src="playerCharacter.image" :class="['player-character', { active: isSpeaking(playerCharacter.id) }]" />
            </div>
            <div class="other-characters">
               <template v-for="char in messageCharacters" :key="char.id">
                  <div v-if="char.animated" 
                       :class="['character-animated', { active: isSpeaking(char.id) }]"
                       :style="{ backgroundImage: `url(${char.image})`, '--frames': char.frames || 8, '--steps': (char.frames || 8) - 1 }">
                  </div>
                  <img v-else-if="char.image" :src="char.image" :class="['character', { active: isSpeaking(char.id) }]" />
               </template>
            </div>
         </div>
      </transition>
      <!-- Caption -->
      <div class="caption relative" v-if="messageContent && messageContent.type === 'caption'">
         <Caption :caption="messageContent" :current-scene="sceneContainingDialogues" :canvas-width="props.canvasWidth" @click="handleClickOnMessage">
            <div class="continue-icon">
               <img :src="iconSkip" />
            </div>
         </Caption>
      </div>
      <transition :name="sceneTransition">
         <div v-if="visible && messageContent" class="message-box" @click="handleClickOnMessage" :style="canvasWidthObj">
            <!-- Dialogue -->
            <div v-if="messageContent.type === 'dialogue'" class="dialogue">
               <strong>{{ getSpeakerName(messageContent.speaker) }}:</strong>
               <p>{{ messageContent.text }}</p>
               <div class="continue-icon">
                  <img :src="iconSkip" />
               </div>
            </div>

            <!-- Choice -->
            <div v-else-if="messageContent.type === 'choice'" class="choices">
               <p v-if="messageContent.text">{{ messageContent.text }}</p>
               <button type="button" v-for="(c, i) in messageContent.choices" :key="i" @click.stop="selectChoice(c)">
                  {{ c.text }}
               </button>
            </div>

            <!-- Combat Choice -->
            <div v-else-if="messageContent.type === 'combatChoice'">
               <CombatChoice :combat-choice="messageContent" :current-scene="sceneContainingDialogues" />
            </div>
         </div>
      </transition>
      <!-- Outcome -->
      <div class="outcome relative" v-if="messageContent && messageContent.type === 'outcome'">
         <Outcome :current-scene="sceneContainingDialogues" :outcome="messageContent" :canvas-width="props.canvasWidth"> </Outcome>
      </div>
   </div>
</template>

<style scoped>
.message-box {
   position: fixed;
   bottom: 40px;
   left: 50%;
   transform: translateX(-50%);
   background: rgb(25 25 35 / 64%);
   color: #fdfdfd;
   padding: 24px 32px;
   border-radius: 16px;
   box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
   font-size: 1.2rem;
   cursor: pointer;
   user-select: none;
   backdrop-filter: blur(5px);
}

.summary {
   color: #ccc;
   line-height: 28px;
}

.dialogue strong {
   color: #00e0ff;
   display: block;
   margin-bottom: 4px;
}

.dialogue p {
   line-height: 28px;
}

.characters {
   display: flex;
   position: relative;
   width: 100%;
   height: 100%;
   pointer-events: none;
   align-items: center;
   flex-direction: row;
   justify-content: space-between;
}

.other-characters,
.player {
   max-height: 50vh;
   max-width: 48vh;
   opacity: 0.9;
   transition:
      transform 0.3s ease,
      opacity 0.3s ease,
      filter 0.3s ease;
   overflow: hidden;
   filter: none;
}

.player-character,
.character {
   width: 256px;
   height: 256px;
   object-fit: contain;
   image-rendering: pixelated;
}

.player-character.active,
.character.active {
   position: relative;
   transform: scale(1.1);
   z-index: 99;
   filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.5));
}

.character-animated {
   width: 256px;
   height: 256px;
   background-size: calc(100% * var(--frames, 8)) 100%;
   background-repeat: no-repeat;
   image-rendering: pixelated;
   transition: transform 0.3s ease, filter 0.3s ease;
   filter: none;
}

.character-animated.active {
   animation: play-talking 0.8s steps(var(--steps, 7)) infinite;
   transform: scale(1.15);
   filter: drop-shadow(0 0 15px rgba(255, 255, 255, 0.6));
}

@keyframes play-talking {
   from { background-position: 0% 0%; }
   to { background-position: 100% 0%; }
}

.choices {
   display: flex;
   flex-direction: column;
   gap: 12px;
   cursor: default;
}

.choices button {
   background: #333;
   border: 2px solid #555;
   color: white;
   padding: 12px;
   border-radius: 8px;
   font-size: 1rem;
   transition: background 0.2s;
}

.choices button:hover {
   background: #444;
}

.continue-icon {
   display: flex;
   flex-direction: row-reverse;
}

.continue-icon img {
   animation: skip-blink 0.8s infinite;
   filter: drop-shadow(0 0 4px #fff);
}

/* transitions */
.fadeIn-enter-active,
.fadeOut-leave-active {
   transition: opacity 0.8s ease;
}

.fadeIn-enter-from,
.fadeOut-leave-to {
   opacity: 0;
}

@keyframes skip-blink {
   0%,
   100% {
      opacity: 1;
      transform: scale(1);
   }

   50% {
      opacity: 0.6;
      transform: scale(1.15);
   }
}

.background-animated {
   position: absolute;
   top: 0;
   left: 0;
   width: 100%;
   height: 100%;
   background-size: calc(100% * var(--frames, 8)) 100%;
   background-repeat: no-repeat;
   image-rendering: pixelated;
   animation: play-bg 3s steps(var(--steps, 7)) infinite;
   z-index: 0;
}

@keyframes play-bg {
   from { background-position: 0% 0%; }
   to { background-position: 100% 0%; }
}
</style>
