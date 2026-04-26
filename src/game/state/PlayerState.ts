import { BehaviorSubject, Subject } from 'rxjs';
import { EquippedItems, InventoryItem, Item, PlayerState, Spell, Stats } from '../../models/EquipmentAndStats';
import { EventBus } from '../../EventBus';

export class PlayerStateService {
   private static _instance: PlayerStateService;
   stateSubject$ = new BehaviorSubject<PlayerState | null>(null);
   levelUp$ = new Subject<number>();
   #name = '';
   #equippedItems: EquippedItems = {
      armor: null,
      primaryWeapon: null,
      accessories: [],
      primarySpell: null,
   };
   #usableItems: InventoryItem[] = [];
   #spells: Spell[] = [];
   #stats: Stats = {
      health: 100,
      mana: 50,
      strength: 1,
      defense: 1,
      speed: 10,
      agility: 1,
      intelligence: 1,
      xp: 1,
      level: 1,
      light: 0,
      darkness: 0,
   };
   #money: number = 0;
   constructor() {}

   static getInstance(): PlayerStateService {
      if (this._instance) {
         return this._instance;
      }

      this._instance = new PlayerStateService();
      return this._instance;
   }

   hydrate(state: PlayerState) {
      if (!state) return;
      this.#name = state.name;
      this.#equippedItems = state.equippedItems;
      this.#usableItems = state.usableItems;
      this.#stats = state.stats;
      this.#spells = state.spells;
      this.#money = state.money;
      this.notifyStateChange();
   }

   private notifyStateChange() {
      const state = this.state;
      this.stateSubject$.next(state);
      // Emit generic event for systems to listen to (Persistence, UI, etc)
      EventBus.emit('player:state-updated', state);
   }

   addItem(item: InventoryItem): InventoryItem {
      const newItem = item;
      const baseItem = item.baseItem;

      // We check for existing same KEY (Catalog Type) for stackable
      const itemExisting = this.#usableItems.find((i) => i.baseItem.key === baseItem.key);

      if (baseItem.stackable) {
         if (itemExisting) {
            itemExisting.quantity += newItem.quantity;
            this.notifyStateChange();
            return itemExisting;
         } else {
            this.#usableItems.push(newItem);
            this.notifyStateChange();
            return newItem;
         }
      }

      // Non-stackable: always check if NOT already in list (for unique instances)
      // If we pass a specific InventoryItem (with UUID), we check if THAT UUID exists
      const instanceExisting = this.#usableItems.find((i) => i.id === newItem.id);
      if (!instanceExisting) {
         this.#usableItems.push(newItem);
      } else {
         console.warn(`Item instance ${newItem.baseItem.name} (${newItem.id}) already in inventory.`);
         return instanceExisting;
      }

      this.notifyStateChange();
      return newItem;
   }

   public useItem(item: InventoryItem) {
      if (item.baseItem.type === 'potion' || item.baseItem.type === 'consumable') {
         const index = this.#usableItems.findIndex((i) => i.id === item.id);
         if (index !== -1) {
            this.#usableItems.splice(index, 1);

            //TODO Applichiamo effetti (es: +vita, +mana)

            console.log(`Used: ${item.baseItem.name}`);
            this.notifyStateChange();
         }
      }
   }

   equipItem(item: Item | InventoryItem): void {
      let inventoryItem: InventoryItem | undefined;

      // Check if input is ALREADY an InventoryItem (has unique ID)
      if ('baseItem' in item) {
         inventoryItem = item;
         // Ensure it's in our tracked items if needed, or we trust the caller.
         // Usually valid InventoryItems come from addItem.
      } else {
         // It's a Catalog Item. Find compatible one in inventory.
         inventoryItem = this.#usableItems.find((i) => i.baseItem.key === item.key);
      }

      if (!inventoryItem) {
         // If not in inventory (and passed as Catalog Item), create fresh instance.
         inventoryItem = {
            id: self.crypto.randomUUID(),
            baseItem: item as Item,
            quantity: 1,
         };
      }

      const baseItem = inventoryItem.baseItem;

      switch (baseItem.type) {
         case 'armor':
            const currentlyArmorEquipped = this.#equippedItems.armor;
            if (currentlyArmorEquipped) {
               this.#usableItems.push(currentlyArmorEquipped);
            }
            this.#equippedItems.armor = inventoryItem;
            break;
         case 'weapon':
            const currentlyWeaponEquipped = this.#equippedItems.primaryWeapon;
            if (currentlyWeaponEquipped) {
               this.#usableItems.push(currentlyWeaponEquipped);
            }
            this.#equippedItems.primaryWeapon = inventoryItem;
            break;
         case 'accessory':
            if (this.#equippedItems.accessories.length < 3) {
               this.#equippedItems.accessories.push(inventoryItem);
            } else {
               //TODO disabilita il tasto per
            }
            break;
      }
      // Remove from usable/inventory
      // If stackable, we reduce quantity? The current logic was "remove from usable".
      // If stackable, we should arguably decrease quantity.
      // But equipping a potion? We don't equip potions.
      // Weapons/Armor are usually not stackable.

      if (baseItem.stackable && inventoryItem.quantity > 1) {
         inventoryItem.quantity -= 1;
      } else {
         this.#usableItems = this.#usableItems.filter((i) => i.id !== inventoryItem!.id);
      }

      console.log(`Equipaggiato: ${baseItem.name}`);
      this.notifyStateChange();
   }

   unequipItem(item: InventoryItem) {
      if (this.#equippedItems.armor?.id === item.id) {
         this.#equippedItems.armor = null;
      } else if (this.#equippedItems.primaryWeapon?.id === item.id) {
         this.#equippedItems.primaryWeapon = null;
      } else {
         const index = this.#equippedItems.accessories.findIndex((a) => a.id === item.id);
         if (index !== -1) {
            this.#equippedItems.accessories.splice(index, 1);
         }
      }

      // Aggiungi all'inventario
      this.#usableItems.push(item);
      console.log(`Equipped object removed and readded to usable: ${item.baseItem.name}`);
      this.notifyStateChange();
   }

   removeItem(itemId: string): void {
      const itemExisting = this.#usableItems.find((i) => i.id === itemId); // Here itemId is the Instance ID
      if (itemExisting) {
         if (itemExisting.baseItem.stackable) {
            if (itemExisting.quantity > 1) {
               itemExisting.quantity -= 1;
            } else {
               this.#usableItems = this.#usableItems.filter((i) => i.id !== itemId);
            }
         } else {
            // Oggetto non stackabile, rimuovilo direttamente
            this.#usableItems = this.#usableItems.filter((i) => i.id !== itemId);
         }
         this.notifyStateChange();
      } else {
         console.warn(`Item ${itemId} non trovato tra gli usabili`);
      }
   }

   getItemByKey(key: string): InventoryItem | undefined {
      return this.#usableItems.find((i) => i.baseItem.key === key);
   }

   consumeItemByKey(key: string): boolean {
      const item = this.getItemByKey(key);
      if (item) {
         if (item.baseItem.stackable && item.quantity > 1) {
            item.quantity -= 1;
         } else {
            this.#usableItems = this.#usableItems.filter((i) => i.id !== item.id);
         }
         console.log(`Consumed item: ${item.baseItem.name} (${key})`);
         this.notifyStateChange();
         return true;
      }
      return false;
   }

   equipSpell(spell: Spell) {
      if (!this.#spells.find((s) => s.id === spell.id)) {
         this.#spells.push(spell);
         console.log(`Magic added: ${spell.name}`);
         this.notifyStateChange();
      }
   }

   updateStats(stats: Partial<Stats>) {
      this.#stats = {
         ...this.#stats,
         ...stats,
      };
      this.notifyStateChange();
   }

   addUsabeItems(items: InventoryItem[]) {
      items.forEach((item) => {
         this.addItem(item);
      });
      // addItem already notifies
   }

   addEquippedItems(usableItems: Partial<EquippedItems>) {
      this.#equippedItems = {
         ...this.#equippedItems,
         ...usableItems,
      };
      this.notifyStateChange();
   }

   /** =====================
    * LEVEL & XP MANAGEMENT
    * ===================== */
   /** Calcola l'XP necessaria per passare al prossimo livello */

   getXpForNextLevel(level: number): number {
      const baseXp = 100;
      const factor = 1.5;
      return Math.floor(baseXp * Math.pow(level, factor));
   }

   /** Aggiunge XP e gestisce il level up automatico */
   addXp(amount: number): void {
      this.#stats.xp += amount;
      console.log(`+${amount} XP (Totale: ${this.#stats.xp}/${this.getXpForNextLevel(this.#stats.level)})`);

      let nextXp = this.getXpForNextLevel(this.#stats.level);
      while (this.#stats.xp >= nextXp) {
         this.#stats.xp -= nextXp;
         this.#stats.level++;
         this.handleLevelUp();
         nextXp = this.getXpForNextLevel(this.#stats.level);
      }

      this.notifyStateChange();
   }

   /** Incrementa statistiche al level up */
   private handleLevelUp(): void {
      const increaseHp = 20;
      const increaseMana = 10;
      const increaseStrength = 2;
      const increaseDefense = 2;

      this.#stats.health += increaseHp;
      this.#stats.mana += increaseMana;
      this.#stats.strength += increaseStrength;
      this.#stats.defense += increaseDefense;

      console.log(`✨ LEVEL UP! Ora sei al livello ${this.#stats.level}`);
      console.log(`+${increaseHp} HP, +${increaseMana} Mana, +${increaseStrength} Forza, +${increaseDefense} Difesa`);

      // Notifica agli altri sistemi
      this.levelUp$.next(this.#stats.level);
   }

   addMoney(amount: number): void {
      this.#money += amount;
      this.notifyStateChange();
   }
   updateName(name: string) {
      if (name) {
         this.#name = name;
         // Name update doesn't strictly need persistence trigger if not critical, but let's be consistent
         this.notifyStateChange();
      }
   }

   get effectiveStats(): Stats {
      const stats = { ...this.#stats };

      const { primaryWeapon, armor, accessories } = this.#equippedItems;

      if (primaryWeapon?.baseItem.stats) {
         if (primaryWeapon.baseItem.stats.strength) stats.strength += primaryWeapon.baseItem.stats.strength;
         if (primaryWeapon.baseItem.stats.defense) stats.defense += primaryWeapon.baseItem.stats.defense;
         if (primaryWeapon.baseItem.stats.speed) stats.speed += primaryWeapon.baseItem.stats.speed;
         // Add other stats if needed
      }

      if (armor?.baseItem.stats) {
         if (armor.baseItem.stats.defense) stats.defense += armor.baseItem.stats.defense;
         // Add other stats
      }

      accessories.forEach((acc) => {
         if (acc.baseItem.stats) {
            if (acc.baseItem.stats.strength) stats.strength += acc.baseItem.stats.strength;
            if (acc.baseItem.stats.defense) stats.defense += acc.baseItem.stats.defense;
            // Add others
         }
      });

      return stats;
   }

   get state(): PlayerState {
      // We expose effectiveStats via a specialized getter, state remains raw for persistence
      return {
         name: this.#name,
         equippedItems: this.#equippedItems,
         usableItems: this.#usableItems,
         stats: this.#stats,
         spells: this.#spells,
         money: this.#money,
      };
   }
}
