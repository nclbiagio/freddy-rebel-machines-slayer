<script setup lang="ts">
import Phaser from 'phaser';
import { computed, onMounted, ref } from 'vue';
import { GameSceneTypes, GameService } from './GameService';
import { onUnmounted } from 'vue';
//SCENES
import { LoadAssetsScene } from './scenes/loadAssets/LoadAssets';
import { MenuStartScene } from './scenes/menuStart/MenuStart';
import { ChapterTemplateScene } from './scenes/_template/Chapter/ChapterTemplate';
import { DialogueScene } from './scenes/dialogue/Dialogue';
import { GameOverScene } from './scenes/gameOver/GameOver';
import { TurnCombatScene } from './game/modules/story/turnCombat/TurnCombat';
import { WorldMapScene } from './game/modules/story/worldMap/WorldMap';
import { ChapterTravelScene } from './game/modules/story/chapterTravel/ChapterTravel';
//COMPONENTS SCENES
import LoadAssets from './scenes/loadAssets/LoadAssets.vue';
import MenuStart from './scenes/menuStart/MenuStart.vue';
import ChapterTemplate from './scenes/_template/Chapter/ChapterTemplate.vue';
import Dialogue from './scenes/dialogue/Dialogue.vue';
import GameOver from './scenes/gameOver/GameOver.vue';
import TurnCombat from './game/modules/story/turnCombat/TurnCombat.vue';
import WorldMap from './game/modules/story/worldMap/WorldMap.vue';
//SHARED COMPONENTS
import Soundtrack from './components/SoundTrack.vue';
import RestartLevel from './components/RestartLevel.vue';
//LEVELS

//NOVEL CHAPTERS

//OTHER
import { LevelStore } from './game/state/LevelStore';
import Debugger from './debug/Debugger.vue';
import { debounceTime, fromEvent, Subscription } from 'rxjs';
import { getCanvasWidth } from './core/utils/Common';
import { MessageUtils } from './message/Message';
import FlyMessage from './message/FlyMessage.vue';

//TO EXTEND
import ToExtendGame from './toExtend/ToExtendGame.vue';
import { toExtendBaseScenes } from './toExtend/scenes/toExtendBaseScenes';
import { FlyMessageModel, FlyMessagesType } from './message/model';

const gameService = GameService.getInstance();
const gameContainer = ref<HTMLElement | null>(null);

const levelStore = LevelStore.getInstance();

const messageUtils = MessageUtils.getInstance();
let flyMessagesSub: Subscription | null = null;

let resizeEvent: Subscription | null = null;
const canvasWidth = ref<string>('width: 0;');

const debugActive = ref(gameService.debug);

const currentScene = ref<GameSceneTypes | null>(null);

const onSceneChange = gameService.scene$.pipe().subscribe((scene) => {
   if (scene) {
      currentScene.value = scene;
   }
});

const errorAndUtilsMessages = ref<FlyMessageModel[]>([]);

const isLoadAssetsScene = computed(() => currentScene.value === 'LoadAssets');
const isMenuStartScene = computed(() => currentScene.value === 'MenuStart');
const isWordMapScene = computed(() => currentScene.value === 'WorldMap');
const isGameScene = computed(
   () =>
      currentScene.value === 'Game' ||
      currentScene.value === 'IntroPrologue' ||
      (currentScene.value?.includes('Level') ?? false) ||
      (currentScene.value?.includes('Room') ?? false) ||
      (currentScene.value?.includes('Chapter') ?? false)
); //ADD all levels here
const isDialogueScene = computed(() => currentScene.value === 'Dialogue');
const isGameOverScene = computed(() => currentScene.value === 'GameOver');

const showSoundTrack = computed(() => currentScene && currentScene.value !== 'LoadAssets' && !debugActive.value);

const levels: Phaser.Types.Scenes.SceneType[] = [];

const forwardMouseEvent = (e: any) => {
   // Evita che Vue/UI blocchino l'evento
   e.stopPropagation();
   e.preventDefault();

   if (!gameService.game?.canvas) return;

   // Creiamo un nuovo evento identico a quello originale
   const newEvent = new e.constructor(e.type, e);

   // Lo dispatchiamo al canvas Phaser
   gameService.game.canvas.dispatchEvent(newEvent);
};

onMounted(() => {
   const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.WEBGL,
      parent: gameContainer.value,
      scene: [
         LoadAssetsScene,
         MenuStartScene,
         ...levels,
         ...toExtendBaseScenes,
         DialogueScene,
         TurnCombatScene,
         WorldMapScene,
         ChapterTravelScene,
         GameOverScene,
      ],
      audio: {
         disableWebAudio: false,
      },
      scale: {
         mode: Phaser.Scale.FIT,
         autoCenter: Phaser.Scale.CENTER_BOTH,
         width: 640,
         height: 640,
      },
      render: {
         pixelArt: true,
         roundPixels: true,
      },
      physics: {
         default: 'arcade',
         arcade: {
            gravity: { x: 0, y: gameService.type === '2D' ? 300 : 0 },
            debug: debugActive.value,
         },
      },
      powerPreference: 'high-performance',
      backgroundColor: '#000000',
   };
   const game = new Phaser.Game(config);
   gameService.game = game;
   canvasWidth.value = getCanvasWidth(canvasWidth.value);
   resizeEvent = fromEvent(window, 'resize')
      .pipe(debounceTime(500))
      .subscribe(() => {
         canvasWidth.value = getCanvasWidth(canvasWidth.value);
      });
   flyMessagesSub = messageUtils.flyMessages$.subscribe((msgs) => {
      errorAndUtilsMessages.value = msgs.filter((msg) => msg.key.includes('error_') || msg.key.includes('utils_'));
   });
});

onUnmounted(() => {
   if (onSceneChange) {
      onSceneChange.unsubscribe();
   }
   if (resizeEvent) {
      resizeEvent.unsubscribe();
   }
   if (flyMessagesSub) {
      flyMessagesSub.unsubscribe();
   }
   gameService.game = null;
});
</script>

<template>
   <Debugger v-if="debugActive" :current-scene="currentScene" />
   <FlyMessage :messages="errorAndUtilsMessages" :duration="1000" />

   <div id="game" ref="gameContainer" :class="{ gameContainer: isGameScene }"></div>
   <div v-if="isLoadAssetsScene" class="scene loadAssets">
      <LoadAssets />
   </div>
   <div v-if="isMenuStartScene" class="scene menuStart">
      <MenuStart :canvas-width="canvasWidth" :show-animated-title="true" />
   </div>
   <div v-if="isDialogueScene" class="scene Dialogue">
      <Dialogue :canvas-width="canvasWidth" />
   </div>
   <div v-if="isWordMapScene" class="scene WordMap">
      <WorldMap :canvas-width="canvasWidth" />
   </div>
   <div v-if="isGameOverScene" class="scene">
      <GameOver />
   </div>
   <div class="toExtendGameScenes">
      <ToExtendGame :current-scene="currentScene" :canvas-width="canvasWidth" :is-game-scene="isGameScene" />
   </div>
   <Soundtrack v-if="showSoundTrack" :current-scene="currentScene" />
   <RestartLevel :current-scene="currentScene" />
</template>

<style scoped>
.graphic-novel-debugger {
   position: fixed;
   bottom: 20px;
   right: 20px;
   z-index: 30000;
}
.graphic-novel-debugger.fs-mode {
   bottom: 0;
   right: 0;
   width: 100vw;
   height: 100vh;
}

.gn-icon {
   width: 40px;
   height: 40px;
   background-color: #333;
   color: white;
   border-radius: 50%;
   display: flex;
   justify-content: center;
   align-items: center;
   font-size: 20px;
   cursor: pointer;
   box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
   transition:
      transform 0.2s,
      background-color 0.2s;
}

.gn-icon:hover {
   transform: scale(1.1);
   background-color: #444;
}

.gn-panel {
   background-color: #222;
   border: 1px solid #444;
   border-radius: 8px;
   box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
   overflow: hidden;
   display: flex;
   flex-direction: column;
   width: 400px; /* Larghezza predefinita del pannello aperto */
}

.gn-panel.fullscreen-mode {
   width: 100vw;
   height: 100vh;
   border-radius: 0;
   border: none;
}

.gn-header {
   display: flex;
   justify-content: space-between;
   align-items: center;
   padding: 10px;
   background-color: #111;
   color: white;
   font-weight: bold;
   border-bottom: 1px solid #333;
}

.gn-close-btn {
   background: none;
   border: none;
   color: white;
   font-size: 20px;
   cursor: pointer;
   padding: 0 5px;
   line-height: 1;
}

.gn-close-btn:hover {
   color: #ccc;
}

.gn-content {
   background-color: #121212; /* Sfondo scuro per il canvas */
   min-height: 200px;
   height: 100%;
   color: black;
   padding: 0; /* padding rimossi per permettere espansione 100% */
}

.gameContainer {
   position: relative;
   z-index: 9998;
}

.game {
   position: absolute;
   top: 0;
   left: 0;
   z-index: 9999;
}

.toExtendGameScenes {
   position: absolute;
   top: 0;
   left: 0;
   width: 100%;
   height: 100%;
   pointer-events: none;
   z-index: 20000; /* High z-index to be on top */
}
</style>
