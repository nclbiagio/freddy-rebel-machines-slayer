import { BehaviorSubject } from 'rxjs';
import { GameSceneTypes, GameService } from '../../GameService';
import { Direction } from '../../models/Entity';
import { DebugUtils } from '../../debug/Debug';
import { EquippedItems, InventoryItem, Spell, Stats } from '../../models/EquipmentAndStats';

export interface PlayerLevelStore {
   lives: number;
   direction: Direction;
   x: number;
   y: number;
   stats: Stats;
   equippedItems: EquippedItems;
   inventory: InventoryItem[];
   spells: Spell[];
   money: number;
}

export interface EnemiesLevelStore {
   id: string;
   name: string;
   x: number;
   y: number;
   type: string;
   being: string;
   lives: number;
   velocity: number;
   status: string;
   pathId?: string;
   specialization?: string; // Catalog Key
}

export interface ChestsLevelStore {
   id: string;
   x: number;
   y: number;
   name: string;
   type: string;
   items: any[]; //TODO
   active: boolean;
}

export interface DoorsLevelStore {
   id: string;
   isVisible: boolean;
   type: string;
   category: string;
   x: number;
   y: number;
   requiresKey?: string; //id of the item key
   lockedMessage?: string;
   triggerId?: string;
   status: string;
   direction: 'top' | 'down' | 'left' | 'right';
   nextScene?: string;
}

export interface SwitchesLevelStore {
   id: string;
   triggerId: string;
   isSwitchedOn: boolean;
   isVisible: boolean;
   type: string;
   category: string;
   x: number;
   y: number;
   oneShot?: boolean;
   isLocked?: boolean;
}

export type Data = {
   score?: number;
   player?: PlayerLevelStore | null;
   enemies?: EnemiesLevelStore[];
   chests?: ChestsLevelStore[];
   doors?: DoorsLevelStore[];
   switches?: SwitchesLevelStore[];
   others?: {
      msgs?: string[]; //TO store which messages has been viewed
      [key: string]: any;
   };
   completed?: boolean;
   timeBest?: number;
   timeLastRun?: number;
};

export const defaultLevelBaseData: Data = {
   score: 0,
   player: null,
   enemies: [],
   chests: [],
   doors: [],
   switches: [],
   others: {},
};

export type DataLevelStore = {
   [key in GameSceneTypes]?: Data;
};
export class LevelStore {
   private static _instance: LevelStore;
   #gameService = GameService.getInstance();
   #debugUtils = DebugUtils.getInstance();
   dataLevel$: BehaviorSubject<DataLevelStore>;

   #STORAGE_KEY = this.#gameService.storageKey;

   #enableSessionStorage = import.meta.env.VITE_ENABLE_SESSION_STORAGE === 'true' || false;

   constructor() {
      const raw = sessionStorage.getItem(this.#STORAGE_KEY);
      const initialValue: DataLevelStore = raw ? JSON.parse(raw) : {};
      this.dataLevel$ = new BehaviorSubject<DataLevelStore>(initialValue);

      this.dataLevel$.subscribe((val) => {
         if (this.#enableSessionStorage) {
            sessionStorage.setItem(this.#STORAGE_KEY, JSON.stringify(val));
         }
      });
   }

   static getInstance(): LevelStore {
      if (this._instance) {
         return this._instance;
      }

      this._instance = new LevelStore();
      return this._instance;
   }

   get isSessionStorageEnabled() {
      return this.#enableSessionStorage;
   }

   enableDisableSessionStorage(value: boolean) {
      console.log('Session storage will now enabled for the game!'.toUpperCase());
      console.log("You need to manually disable it if you won't it anymore".toUpperCase());
      this.#enableSessionStorage = value;
   }

   get dataLevel() {
      return this.dataLevel$.getValue();
   }

   get dataLevelFromSession() {
      if (!this.#enableSessionStorage) return null;
      const raw = sessionStorage.getItem(this.#STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
   }

   /**
    *
    * @param gameScene
    * @description call this method on each scene to initialize a new level/scene/room store
    */
   setLevelStore(gameScene: GameSceneTypes, data?: Data) {
      const dataLevel = this.dataLevel$.getValue();
      if (!dataLevel[gameScene]) {
         dataLevel[gameScene] = {
            ...defaultLevelBaseData,
         };
         this.dataLevel$.next(dataLevel);
      }
      if (data) {
         const dataLevelClone = structuredClone(dataLevel[gameScene]);

         // Special handling for 'others' to ensure deep merge
         let mergedOthers = dataLevelClone?.others || {};
         if (data.others) {
            mergedOthers = {
               ...mergedOthers,
               ...data.others,
            };
         }

         dataLevel[gameScene] = {
            ...dataLevelClone,
            ...data,
            others: mergedOthers, // Override simple spread with merged version
         };
         this.dataLevel$.next({ ...dataLevel });
      }
      if (this.#gameService.debug) {
         this.#debugUtils.dataLevel$.next(this.dataLevel$.getValue());
      }
   }
}
