import { Subject } from 'rxjs';

export interface DamageEvent {
   x: number;
   y: number;
   amount: number;
   type: 'physical' | 'magical' | 'critical' | 'heal';
}

export class BattleEvents {
   private static _instance: BattleEvents;
   damageSubject$ = new Subject<DamageEvent>();

   private constructor() {}

   static getInstance(): BattleEvents {
      if (!this._instance) {
         this._instance = new BattleEvents();
      }
      return this._instance;
   }

   showDamage(x: number, y: number, amount: number, type: 'physical' | 'magical' | 'critical' | 'heal' = 'physical') {
      this.damageSubject$.next({ x, y, amount, type });
   }
}
