import { Scene } from 'phaser';
import { GameSceneTypes, GameService } from '../../../../GameService';
import { MusicTracker } from '../../../../core/audio/MusicTracker';
import { PlayerStateService } from '../../../state/PlayerState';
import { CombatRewardState, CombatState } from '../../../../models/TurnCombatModel';
import { EventBus } from '../../../../EventBus';
import { InventoryItem, Spell } from '../../../../models/EquipmentAndStats';
import { roll } from '../../../../core/utils/Common';
import { getEnemyById } from '../../../data/TurnCombatEnemies';
import { ItemCatalog } from '../../../../game/data/ItemsAndSpellsCatalog';
import { SceneData } from '../../../../models/Game';

//TODO prevedi la possibilità di avere una lista di nemici piuttosto che solo uno alla volta

type ExtendedSceneData = (SceneData & { enemyId: string; nextScene: GameSceneTypes }) | undefined;

export class TurnCombatScene extends Scene {
   static sceneKey: GameSceneTypes = 'TurnCombat';
   #data: ExtendedSceneData;
   #gameService = GameService.getInstance();
   #playerStats = PlayerStateService.getInstance();
   #musicTracker = new MusicTracker(this, TurnCombatScene.sceneKey);

   #state!: CombatState;

   constructor() {
      super({
         key: TurnCombatScene.sceneKey,
      });
   }

   init(data: ExtendedSceneData) {
      this.#data = data;
      this.#gameService.scene$.next(TurnCombatScene.sceneKey);
      if (!this.#gameService.debug) {
         this.#musicTracker.initSceneSoundTrackEvents(false);
      }

      const enemy = getEnemyById(this.#data?.enemyId || '');

      this.#state = {
         turn: 'player',
         player: this.#playerStats.state,
         enemy,
         log: [],
         finished: false,
         victory: false,
         onFinishNextScene: this.#data?.nextScene || 'Error',
      };
   }

   updateState(data: Partial<CombatState>) {
      this.#state = {
         ...this.#state,
         ...data,
      };
   }

   create() {
      this.createSceneEvents();
      this.createSceneInputEvents();
      setTimeout(() => {
         const playerSpeed = this.#playerStats.state.stats.speed;
         const enemySpeed = this.#state.enemy.speed || 0;

         if (enemySpeed > playerSpeed) {
            this.startEnemyTurn();
         } else {
            this.startPlayerTurn();
         }
      }, 0);
   }

   createSceneEvents() {
      EventBus.on('trigger-scene', () => {
         this.#gameService.nextSceneFromTimeline(TurnCombatScene.sceneKey, this, this.#data?.nextScene, this.#data);
      });
      EventBus.on('playerAction', (action: { type: string; id?: string }) => {
         this.playerAction(action);
      });
   }

   createSceneInputEvents() {
      //remove audio
      this.input.keyboard?.on('keydown-Q', () => {
         this.#musicTracker.toggleSoundtrack();
      });
   }

   startPlayerTurn() {
      if (this.#state.turn !== 'player') {
         this.updateState({
            turn: 'player',
         });
      }
      EventBus.emit('stateUpdate', this.snapshot());
   }

   startEnemyTurn() {
      if (this.#state.turn !== 'enemy') {
         this.updateState({
            turn: 'enemy',
         });
      }
      const dmg = this.calcEnemyDamage();
      const playerCurrentHp = this.#playerStats.state.stats.health;
      const updatedPlayerHp = playerCurrentHp - dmg;
      this.#playerStats.updateStats({
         health: updatedPlayerHp,
      });
      this.updateState({
         player: this.#playerStats.state,
      });
      console.log(`${this.#state.enemy.name} infligge ${dmg} danni.`);

      if (this.checkEnd()) return;
      this.time.delayedCall(400, () => this.startPlayerTurn());
   }

   playerAction(action: { type: string; id?: string }) {
      // Questo metodo verrà chiamato dal componente Vue alla selezione delle azioni del giocatore.
      if (this.#state.turn !== 'player' || this.#state.finished) return;

      if (action.type === 'flee') return this.handleFlee();

      if (action.type === 'basic') {
         this.onPlayerBasicAttack();
      }

      if (action.type === 'spell') {
         this.onPlayerSpellAttack(action.id);
      }

      if (this.checkEnd()) return;
      this.time.delayedCall(400, () => this.startEnemyTurn());
   }

   onPlayerBasicAttack() {
      const dmg = this.calcPlayerDamage();
      this.handleEnemyHpStatus(dmg);
   }

   onPlayerSpellAttack(spellId: string | undefined) {
      const spell = this.#playerStats.state.spells.find((s) => s.id === spellId);
      if (spell && spellId) {
         if (this.#playerStats.state.stats.mana < spell.cost) {
            console.log('Mana insufficiente.');
            return;
         }
      } else {
         console.warn(`Spell id ${spellId} not exists or not available`);
         return;
      }

      const currentPlayerMana = this.#playerStats.state.stats.mana;
      const updatedPlayerMana = currentPlayerMana - spell.cost;

      this.#playerStats.updateStats({
         mana: updatedPlayerMana,
      });
      this.updateState({
         player: this.#playerStats.state,
      });

      const dmg = this.calcPlayerDamage(spell);
      this.handleEnemyHpStatus(dmg);
      //spell.effect?.(this.state);

      console.log(`${spell.name} infligge ${dmg} danni!`);
   }

   handleFlee() {
      const chance = this.#state.enemy.fleeChance ?? 0.7;
      if (Math.random() < chance) {
         console.log('Fuga riuscita!');
         this.finish(false);
      } else {
         console.log('Fuga fallita!');
         this.time.delayedCall(300, () => this.startEnemyTurn());
      }
   }

   handleEnemyHpStatus(dmg: number) {
      const currentEnemyHp = this.#state.enemy.hp;
      const updatedEnemeyHp = currentEnemyHp - dmg;
      this.updateState({
         enemy: {
            ...this.#state.enemy,
            hp: updatedEnemeyHp,
         },
      });
   }

   calcPlayerDamage(spell?: Spell) {
      if (spell) {
         const spellDmg = roll(spell.dmgMin, spell.dmgMax);
         // (opzionale) bonus che scala con intelligenza, luce, ecc.
         const intBonus = Math.floor(this.#playerStats.state.stats.intelligence * 0.5);
         return spellDmg + intBonus;
      }

      const weaponStr = this.#playerStats.state.equippedItems.primaryWeapon?.baseItem.stats?.strength || 0;
      const playerStr = this.#playerStats.state.stats.strength;
      const atk = playerStr + weaponStr;
      return roll(Math.floor(atk * 0.8), Math.floor(atk * 1.2));
   }

   /**
    *
    * @returns
    * @description Come funziona
    * Se playerAgi ≤ enemyAgi → dodgeChance è 0 % (nessuna schivata garantita).
    * Ogni punto di agilità in più rispetto al nemico aumenta la chance di schivata dell’1 % fino a un massimo del 50 %.
    * - Esempio: player 40 AGI, enemy 20 AGI → (40‑20)*0.01 = 0.20 → 20 % dodge.
    * - Player 80 AGI, enemy 20 AGI → 60 % ma cap a 50 %.
    * Così l’agilità del nemico conta davvero, e il giocatore non può superare un limite ragionevole di evasione.
    */
   calcEnemyDamage() {
      const { dmgMin, dmgMax, agility } = this.#state.enemy;

      const playerAgi = this.#playerStats.state.stats.agility;
      const enemyAgi = agility ?? 0;

      // Formula: chance = (playerAgi - enemyAgi) * 0.01, clamp 0‑50 %
      //   • se il nemico è più agile, la chance può arrivare a 0
      //   • se il giocatore ha 50+ agi in più, raggiunge il cap 50 %
      let dodgeChance = (playerAgi - enemyAgi) * 0.01;
      dodgeChance = Math.max(0, Math.min(dodgeChance, 0.5)); // clamp 0‑0.5

      if (Math.random() < dodgeChance) {
         console.log('Il giocatore ha schivato!');
         return 0;
      }

      // ---------------- Danno mitigato dalla difesa ----------------
      const defenseBonus = this.#playerStats.state.equippedItems.armor?.baseItem.stats?.defense ?? 0;
      const raw = roll(dmgMin, dmgMax);
      return Math.max(raw - defenseBonus, 1);
   }

   checkEnd(): boolean {
      if (this.#state.enemy.hp <= 0) return this.finish(true);
      if (this.#state.player.stats.health <= 0) return this.finish(false);
      EventBus.emit('stateUpdate', this.snapshot());
      return false;
   }

   finish(victory: boolean) {
      this.#state.finished = true;
      this.#state.victory = victory;
      //EventBus.emit('stateUpdate', this.snapshot());

      const loot = victory ? (this.#state.enemy.lootTable?.filter((e) => Math.random() < e.chance).map((e) => e.id) ?? []) : [];

      const result: CombatRewardState = {
         victory,
         xp: victory ? this.#state.enemy.xp || 0 : 0,
         loot,
      };

      if (victory) {
         // XP
         this.#playerStats.updateStats({
            xp: result.xp,
         });

         // Loot (stack/aggiunta)
         loot.forEach((id) => {
            const item = ItemCatalog[id];
            if (item) {
               const newItem: InventoryItem = {
                  id: self.crypto.randomUUID(),
                  baseItem: item,
                  quantity: 1,
               };
               this.#playerStats.addItem(newItem);
            } else {
               console.warn(`Impossible to add item with id ${id}! Not available into ItemCatalog`);
            }
         });
      }

      this.time.delayedCall(300, () => {
         EventBus.emit('combatReward', result);
      });

      console.log(victory ? 'Vittoria!' : 'Sconfitta...');

      return true;
   }

   snapshot() {
      return { ...this.#state };
   }
}
