<script setup lang="ts">
import { onMounted, onUnmounted, ref, watchEffect } from 'vue';
import { DebugUtils } from './Debug';
import { combineLatest, tap } from 'rxjs';
import { GameSceneTypes, GameService } from '../GameService';
import { timelime } from '../Timeline';
import { SceneData } from '../models/Game';
import { getExampleDialogue } from '../scenes/dialogue/example';
import { MessageUtils } from '../message/Message';

/**
 * There are some games where this debugger create problems with mouse event because is on top of the canvas
 * For this reason initially is hided with a width and height of 0 and I put an event listener for the TAB click to show hide the debugger
 * If you want to move between the scenes you can use the proper select when visible or a query paramter "scene" valued with the proper scene
 * TODO consider to transform the debugger component into a proper scene
 */

const props = defineProps<{ currentScene: string | null }>();

const debuggerUtils = DebugUtils.getInstance();
const gameService = GameService.getInstance();
const messageUtils = MessageUtils.getInstance();

const scenesList = ref<GameSceneTypes[]>(
   timelime
      .filter((scene) => {
         if (scene.hideInDebugger !== undefined && scene.hideInDebugger) {
            return false;
         }
         if (!scene.specificFor) {
            return true;
         }
         if (scene.specificFor && scene.specificFor.includes(gameService.type)) {
            return true;
         }
         return false;
      })
      .map((scene) => scene.id)
);

const status = ref<'closed' | 'open'>('closed');

const playerVm = ref<{ status: string; direction: string }>({ status: '', direction: '' });
const weaponVm = ref<{ status: string; otherStatus: string }>({ status: '', otherStatus: '' }); //otherStatus is used for debug
const dataLevelVm = ref<any>({});
const fpsDebug = ref(0);
const deltaDebug = ref(0);
const selectedScene = ref<GameSceneTypes | null>(null);
const sceneHistory = ref('');
const removeStorageIsDisabled = ref(true);

const fps$ = combineLatest([gameService.fps$, gameService.delta$])
   .pipe(
      tap(([fps, delta]) => {
         fpsDebug.value = Number(fps.toFixed(2));
         deltaDebug.value = Number(delta.toFixed(2));
      })
   )
   .subscribe();

const player$ = debuggerUtils.gamePlayer$.subscribe((player) => {
   if (player) {
      playerVm.value = player;
   } else {
      playerVm.value = { status: '', direction: '' };
   }
});

const weapon$ = debuggerUtils.weapon$.subscribe((weapon) => {
   if (weapon) {
      weaponVm.value = weapon;
   } else {
      weaponVm.value = { status: '', otherStatus: '' };
   }
});

const dataLevel$ = debuggerUtils.dataLevel$.subscribe((data) => {
   if (data) {
      dataLevelVm.value = data;
   } else {
      dataLevelVm.value = {};
   }
});

const onSceneChange$ = gameService.scene$.subscribe(() => {
   sceneHistory.value = gameService.historyScenes.join(' => ');
});

const changeScene = (event: any) => {
   if (event.target.value !== props.currentScene && status.value === 'open') {
      let data: SceneData & { [key: string]: any } = {
         toDebug: true,
      };
      if (event.target.value === 'ChapterTemplate') {
         data = {
            ...data,
            nextScene: event.target.value,
            msgId: 'msg1',
         };
      }
      if (event.target.value === 'Dialogue') {
         data = {
            ...data,
            msgId: 'example_msg2',
            messages: getExampleDialogue(gameService.assetsPath),
         };
      }
      if (event.target.value === 'TurnCombat') {
         data = {
            ...data,
            enemyId: 'wraith_lv1',
         };
      }
      if (event.target.value === 'WorldMap') {
         data = {
            ...data,
            //locationId: '', //remove comment to locationId if you want to test a sub map
         };
      }
      if (event.target.value === 'ChapterTravel') {
         data = {
            ...data,
            nextScene: 'Example',
         };
      }
      console.log(`Travel to ${event.target.value}`);
      // gameService.travelToScene(event.target.value, data);
   }
   toggleDebugger();
};

const handleKeyDown = (e: KeyboardEvent) => {
   if (e.key === 'Tab') {
      e.preventDefault(); // evita il cambio di focus
      toggleDebugger();
   }
};

const toggleDebugger = () => {
   if (status.value === 'open') {
      status.value = 'closed';
   } else if (status.value === 'closed') {
      status.value = 'open';
   }
};

const removeStorage = () => {
   if (sessionStorage.getItem(gameService.storageKey)) {
      sessionStorage.removeItem(gameService.storageKey);
      removeStorageIsDisabled.value = true;
      messageUtils.addFlyMessage({ key: 'utils_removedSession', text: `Chiave "${gameService.storageKey}" rimossa! RICARICA LA PAGINA MANUALMENTE` });
      //location.reload();
   } else {
      messageUtils.addFlyMessage({ key: 'error_removedSession', text: `Chiave "${gameService.storageKey}" non presente` });
   }
};

watchEffect(() => {
   selectedScene.value = props.currentScene as GameSceneTypes;
});

onMounted(() => {
   window.addEventListener('keydown', handleKeyDown);
   const urlParams = new URLSearchParams(window.location.search);
   let value = urlParams.get('scene');
   if (value) {
      setTimeout(() => {
         changeScene({ target: { value: 'SandBox' } });
      }, 1000);
   }
   if (sessionStorage.getItem(gameService.storageKey)) {
      removeStorageIsDisabled.value = false;
   }
});

onUnmounted(() => {
   if (player$) {
      player$.unsubscribe;
   }
   if (fps$) {
      fps$.unsubscribe();
   }
   if (dataLevel$) {
      dataLevel$.unsubscribe();
   }
   if (weapon$) {
      weapon$.unsubscribe();
   }
   if (onSceneChange$) {
      onSceneChange$.unsubscribe();
   }
   window.removeEventListener('keydown', handleKeyDown);
});
</script>

<template>
   <div class="debug flex flex-col" :class="{ isClosed: status === 'closed' }">
      <div class="relative">
         <div class="debugFps flex flex-col">
            <span class="fps element">FPS: {{ fpsDebug }}</span>
            <span class="delta element">DELTA: {{ deltaDebug }}</span>
         </div>
         <div class="remove-storage">
            <button
               class="w-full bg-red-600 text-white font-bold pl-3 pr-8 py-2 rounded-lg"
               :disabled="removeStorageIsDisabled"
               :class="{ isDisabled: removeStorageIsDisabled, 'hover:bg-red-700': !removeStorageIsDisabled }"
               @click="removeStorage"
            >
               Remove Storage
            </button>
         </div>
         <div class="currentScene">
            {{ currentScene }}
         </div>
         <div class="select-scene">
            <div class="relative">
               <select
                  v-model="selectedScene"
                  @change="changeScene($event)"
                  @click.stop
                  class="w-full bg-white placeholder:text-slate-400 text-slate-700 text-sm border border-slate-200 rounded pl-3 pr-8 py-2 transition duration-300 ease focus:outline-none focus:border-slate-400 hover:border-slate-400 shadow-sm focus:shadow-md appearance-none cursor-pointer"
               >
                  <option v-for="(scene, index) in scenesList" :key="index" :value="scene">{{ scene }}</option>
               </select>
               <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.2"
                  stroke="currentColor"
                  class="h-5 w-5 ml-1 absolute top-2.5 right-2.5 text-slate-700"
               >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 15 12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
               </svg>
            </div>
         </div>
         <div class="scenes-history">
            {{ sceneHistory }}
         </div>
         <div class="entities flex flex-col">
            <div class="card">
               <h1>Player</h1>
               <pre>{{ playerVm }}</pre>
            </div>
            <div class="card">
               <h1>Weapon</h1>
               <pre>{{ weaponVm }}</pre>
            </div>
            <div class="card">
               <h1>Data Level</h1>
               <pre>{{ dataLevelVm }}</pre>
            </div>
         </div>
      </div>
   </div>
</template>

<style scoped>
.debug {
   color: white;
   position: absolute;
   top: 0;
   left: 0;
   font-size: 12px;
   z-index: 9999;
   overflow: hidden;
   width: 400px;
   height: 100%;
   transition: width 0.3s ease;
   background: rgba(236, 227, 227, 0.6);
}

.isClosed {
   width: 0;
   height: 0;
}

.currentScene,
.select-scene,
.scenes-history,
.remove-storage,
.debugFps {
   padding: 10px;
   margin: 10px;
}

.select-scene {
   width: 250px;
   padding-left: 0;
   padding-right: 0;
}

.scenes-history {
   font-size: 8px;
}

.debugFps .element {
   margin-bottom: 10px;
}

.debugFps button:disabled {
   opacity: 0.4;
}

.debug .entities {
   width: 100%;
   height: 100%;
}

.debug .entities .card {
   border: 1px dashed #ccc;
   padding: 10px;
   margin: 4px;
   font-size: 10px;
   color: black;
   /* bottom: 10px; */
   max-height: 100%;
   max-width: 98%;
   width: 100%;
   overflow: auto;
   background: #f8f8ff94;
}

.debug .entities .card h1 {
   color: black;
   margin-bottom: 4px;
}

.isDisabled {
   opacity: 0.5;
}
</style>
