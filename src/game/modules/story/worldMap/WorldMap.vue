<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { MapLocation } from '../../../../models/Map';
import { ProgressManager } from '../../../../core/systems/ProgressManager';
import { EventBus } from '../../../../EventBus';

const props = defineProps<{ canvasWidth: string }>();

const storyProgress = ProgressManager.getInstance();

const computedStyle = computed(() => {
   // Fallback se la larghezza non è ancora stata calcolata da Phaser (es. al refresh)
   if (props.canvasWidth === 'width: 0;' || props.canvasWidth === 'width: 0px;') {
      return 'width: 640px;';
   }
   return props.canvasWidth;
});

const displayedLocations = ref<MapLocation[]>([]);
const macroLocations = ref<MapLocation[]>([]); // Memorizza i livelli principali
const currentLocation = ref<MapLocation | null>(null);
const breadcrumb = ref<{ label: string; locationId: string | null }[]>([]);

const loadMacroMap = (locations: MapLocation[]) => {
   macroLocations.value = locations;
   displayedLocations.value = locations;
   currentLocation.value = null;
   breadcrumb.value = [{ label: 'Mappa', locationId: null }];
};

const loadSubMap = (parent: MapLocation, subLocations: MapLocation[]) => {
   displayedLocations.value = subLocations;
   currentLocation.value = parent;
   breadcrumb.value = [
      { label: 'Mappa', locationId: null },
      { label: parent.name, locationId: parent.id },
   ];
};

const goBack = () => {
   // Torna alla macro mappa usando i dati memorizzati
   displayedLocations.value = macroLocations.value;
   currentLocation.value = null;
   breadcrumb.value = [{ label: 'Mappa', locationId: null }];
};

const onLocationClick = (loc: MapLocation) => {
   if (!loc.unlocked) return;

   if (currentLocation.value) {
      // siamo in una sub-mappa → entra in sub-luogo
      loc.visited = true;
      loc.hasNewContent = false;
      storyProgress.flagEvent(`sub:${currentLocation.value.id}:${loc.id}:visited`);
      storyProgress.markSceneAsVisited(loc.id);
      // qui puoi lanciare dialoghi, scene, ecc.
      EventBus.emit('world-map:sub-location-selected', {
         id: currentLocation.value.id,
         subId: loc.id,
      });
   } else {
      // siamo nella mappa macro → se ha sub-location le carichiamo, altrimenti viaggiamo
      if (loc.subLocations && loc.subLocations.length > 0) {
          // La scena Phaser gestirà il cambio a ChapterTravel o SubMap, 
          // ma qui il componente Vue reagirà all'evento emesso dalla scena.
          EventBus.emit('world-map:location-selected', { id: loc.id });
      } else {
          EventBus.emit('world-map:location-selected', { id: loc.id });
      }
   }
};

onMounted(() => {
   // Dati dalla scena Phaser
   EventBus.on('world-map:update', (locations: MapLocation[]) => {
      loadMacroMap(locations);
   });

   // FIXED payload mapping: parent & locations
   EventBus.on('world-map:submap-update', (payload: { parent: MapLocation; locations: MapLocation[] }) => {
      loadSubMap(payload.parent, payload.locations);
   });
});
</script>

<template>
   <div class="relative w-full h-full p-6 bg-slate-900 border-2 border-slate-700 rounded-xl overflow-hidden flex flex-col" :style="computedStyle">
      <!-- Background overlay -->
      <div class="absolute inset-0 bg-blue-900/10 pointer-events-none mix-blend-overlay"></div>
      
      <div class="header shrink-0">
         <button v-if="breadcrumb.length > 1" @click="goBack" class="back-btn">← Back to World Map</button>
         <h1 class="location-title">{{ currentLocation?.name || 'MISSION SELECTOR' }}</h1>
      </div>

      <div class="mission-grid flex-grow overflow-y-auto">
         <div
            v-for="loc in displayedLocations"
            :key="loc.id"
            class="mission-card"
            :class="{ unlocked: loc.unlocked, completed: loc.isCompleted, 'new-content': loc.hasNewContent }"
            @click="onLocationClick(loc)"
         >
            <div class="card-status" v-if="loc.isCompleted">COMPLETED</div>
            <div class="card-status new" v-else-if="loc.hasNewContent">NEW</div>
            
            <div class="icon-container">
               <img :src="loc.icon" :alt="loc.name" class="icon-img" />
               <div v-if="!loc.unlocked" class="lock-overlay">🔒</div>
            </div>
            
            <div class="card-info">
               <span class="location-name">{{ loc.name }}</span>
               <div class="status-bar" v-if="loc.unlocked">
                  <div class="status-dot" :class="{ 'bg-green-400': loc.isCompleted, 'bg-blue-400': !loc.isCompleted }"></div>
                  <span class="text-[10px] uppercase tracking-widest text-slate-400">
                     {{ loc.isCompleted ? 'AVAILABLE' : 'IN PROGRESS' }}
                  </span>
               </div>
               <span v-else class="text-[10px] uppercase tracking-widest text-red-500 font-bold">LOCKED</span>
            </div>

            <!-- Hover scanline effect -->
            <div class="scanline"></div>
         </div>
      </div>
   </div>
</template>

<style scoped>
.header {
   display: flex;
   flex-direction: column;
   align-items: center;
   margin-bottom: 32px;
   position: relative;
   z-index: 10;
}

.back-btn {
   background: rgba(30, 41, 59, 0.8);
   color: #94a3b8;
   padding: 4px 12px;
   border-radius: 4px;
   border: 1px solid #334155;
   font-size: 12px;
   margin-bottom: 8px;
   transition: all 0.2s ease;
}

.back-btn:hover {
   background: #334155;
   color: white;
}

.location-title {
   color: #38bdf8;
   font-size: 24px;
   font-weight: 800;
   letter-spacing: 4px;
   text-transform: uppercase;
   text-shadow: 0 0 10px rgba(56, 189, 248, 0.4);
}

.mission-grid {
   display: grid;
   grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
   align-content: start;
   gap: 24px;
   padding: 16px;
   position: relative;
   z-index: 10;
   width: 100%;
}

.mission-card {
   background: rgba(15, 23, 42, 0.6);
   border: 1px solid #334155;
   border-radius: 12px;
   padding: 20px;
   display: flex;
   flex-direction: column;
   align-items: center;
   transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
   cursor: not-allowed;
   position: relative;
   overflow: hidden;
   box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.mission-card::before {
   content: '';
   position: absolute;
   top: 0;
   left: 0;
   right: 0;
   height: 2px;
   background: #334155;
   transition: all 0.3s ease;
}

.mission-card.unlocked {
   cursor: pointer;
   opacity: 1;
}

.mission-card.unlocked:hover {
   transform: translateY(-5px);
   background: rgba(30, 41, 59, 0.8);
   border-color: #38bdf8;
   box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.3), 0 0 15px rgba(56, 189, 248, 0.2);
}

.mission-card.unlocked:hover::before {
   background: #38bdf8;
   box-shadow: 0 0 10px #38bdf8;
}

.card-status {
   position: absolute;
   top: 8px;
   right: 8px;
   font-size: 9px;
   font-weight: 900;
   padding: 2px 6px;
   border-radius: 4px;
   background: #059669;
   color: white;
}

.card-status.new {
   background: #3b82f6;
   animation: pulse 2s infinite;
}

.icon-container {
   width: 80px;
   height: 80px;
   background: #1e293b;
   border-radius: 50%;
   display: flex;
   justify-content: center;
   align-items: center;
   margin-bottom: 16px;
   border: 2px solid #334155;
   position: relative;
   transition: all 0.3s ease;
}

.unlocked .icon-container {
   border-color: #38bdf844;
   background: radial-gradient(circle, rgba(56, 189, 248, 0.2) 0%, rgba(30, 41, 59, 1) 100%);
}

.unlocked:hover .icon-container {
   transform: scale(1.1);
   border-color: #38bdf8;
}

.icon-img {
   width: 54px;
   height: 54px;
   object-fit: contain;
   filter: grayscale(100%);
   opacity: 0.5;
   transition: all 0.3s ease;
}

.unlocked .icon-img {
   filter: drop-shadow(0 0 5px rgba(56, 189, 248, 0.5));
   opacity: 1;
}

.lock-overlay {
   position: absolute;
   font-size: 20px;
   background: rgba(15, 23, 42, 0.8);
   width: 100%;
   height: 100%;
   display: flex;
   justify-content: center;
   align-items: center;
   border-radius: 50%;
}

.card-info {
   text-align: center;
}

.location-name {
   display: block;
   color: #e2e8f0;
   font-size: 16px;
   font-weight: 700;
   margin-bottom: 8px;
   transition: all 0.3s ease;
}

.unlocked:hover .location-name {
   color: #38bdf8;
}

.status-bar {
   display: flex;
   align-items: center;
   justify-content: center;
   gap: 6px;
}

.status-dot {
   width: 6px;
   height: 6px;
   border-radius: 50%;
}

.scanline {
   position: absolute;
   top: 0;
   left: -100%;
   width: 100%;
   height: 100%;
   background: linear-gradient(to right, transparent, rgba(56, 189, 248, 0.05), transparent);
   transition: all 0.5s ease;
   pointer-events: none;
}

.unlocked:hover .scanline {
   left: 100%;
}

@keyframes pulse {
   0% { opacity: 1; }
   50% { opacity: 0.6; }
   100% { opacity: 1; }
}

/* Background Decoration */
.mission-grid::after {
   content: '';
   position: absolute;
   inset: 0;
   background-image: radial-gradient(#334155 0.5px, transparent 0.5px);
   background-size: 20px 20px;
   opacity: 0.2;
   z-index: -1;
}
</style>
