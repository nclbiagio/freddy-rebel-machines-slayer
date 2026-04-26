import { BehaviorSubject } from 'rxjs';

export interface ProgressState {
   completedMessages: string[];
   completedScenes: string[];
   visitedScenes: string[];
   choicesMade: Record<string, string>;
   eventFlags: string[];
}

const DEFAULT_STATE: ProgressState = {
   completedMessages: [],
   completedScenes: [],
   visitedScenes: [],
   choicesMade: {},
   eventFlags: [],
};

export class ProgressManager {
   private static _instance: ProgressManager;
   private STORAGE_KEY = 'freddy-rebel-machines-slayer-progress'; // Separate key from LevelStore

   public state$: BehaviorSubject<ProgressState>;

   private constructor() {
      const raw = sessionStorage.getItem(this.STORAGE_KEY);
      const initialValue: ProgressState = raw ? { ...DEFAULT_STATE, ...JSON.parse(raw) } : { ...DEFAULT_STATE };

      // Convert arrays back to Sets for internal logic if needed, OR just use arrays in state
      // Using arrays in state is easier for JSON serialization.
      this.state$ = new BehaviorSubject<ProgressState>(initialValue);

      this.state$.subscribe((val) => {
         sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(val));
      });
   }

   static getInstance(): ProgressManager {
      if (this._instance) {
         return this._instance;
      }

      this._instance = new ProgressManager();
      return this._instance;
   }

   private updateState(partialState: Partial<ProgressState>) {
      const current = this.state$.value;
      this.state$.next({
         ...current,
         ...partialState,
      });
   }

   // ✅ Tracciamento messaggi/dialoghi
   markMessageAsRead(id: string) {
      const current = this.state$.value.completedMessages;
      if (!current.includes(id)) {
         this.updateState({ completedMessages: [...current, id] });
      }
   }

   hasReadMessage(id: string): boolean {
      return this.state$.value.completedMessages.includes(id);
   }

   markSceneAsVisited(sceneId: string) {
      const current = this.state$.value.visitedScenes;
      if (!current.includes(sceneId)) {
         this.updateState({ visitedScenes: [...current, sceneId] });
      }
   }

   isSceneVisited(sceneId: string): boolean {
      return this.state$.value.visitedScenes.includes(sceneId);
   }

   // ✅ Tracciamento scene intere (capitoli)
   markSceneAsCompleted(sceneId: string) {
      const current = this.state$.value.completedScenes;
      if (!current.includes(sceneId)) {
         this.updateState({ completedScenes: [...current, sceneId] });
      }
   }

   isSceneCompleted(sceneId: string): boolean {
      return this.state$.value.completedScenes.includes(sceneId);
   }

   // ✅ Tracciamento scelte
   recordChoice(choiceId: string, optionText: string) {
      const current = this.state$.value.choicesMade;
      this.updateState({
         choicesMade: {
            ...current,
            [choiceId]: optionText,
         },
      });
   }

   getChoice(choiceId: string): string | undefined {
      return this.state$.value.choicesMade[choiceId];
   }

   // ✅ Eventi arbitrari
   flagEvent(id: string) {
      const current = this.state$.value.eventFlags;
      if (!current.includes(id)) {
         this.updateState({ eventFlags: [...current, id] });
      }
   }

   hasEvent(id: string): boolean {
      return this.state$.value.eventFlags.includes(id);
   }

   // Optional: serializzazione per salvataggio (manuale, se serve esportare)
   serialize(): object {
      return this.state$.value;
   }

   load(data: ProgressState) {
      this.state$.next(data);
   }
}
