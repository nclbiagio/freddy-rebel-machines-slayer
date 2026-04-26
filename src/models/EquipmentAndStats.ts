export interface ItemStats {
   strength: number;
   defense: number;
   speed: number;
   agility: number;
   intelligence: number;
}

export type ItemType = 'weapon' | 'armor' | 'potion' | 'accessory' | 'consumable' | 'key' | 'empty'; //empty used in inventory empty slots

export interface Item {
   key: string;
   name: string;
   description?: string;
   type: ItemType;
   icon: string;
   stackable: boolean;
   stats?: Partial<ItemStats>;
   effects?: Record<string, number>; // es: { health: +10, mana: -5 }
   rarity?: 'rare' | 'epic';
}

//TODO move this into proper sprite
export interface Spell {
   id: string;
   name: string;
   description?: string;
   cost: number;
   icon?: string;
   dmgMin: number;
   dmgMax: number;
   effect?: (state: any) => void; // extra (cura, buff, debuff)
}

export interface InventoryItem {
   id: string; // Instance UUID
   baseItem: Item;
   quantity: number;
}

export interface EquippedItems {
   armor: InventoryItem | null;
   primaryWeapon: InventoryItem | null;
   accessories: InventoryItem[]; // es: anelli, amuleti ecc.
   primarySpell: Spell | null;
}

export interface Stats extends ItemStats {
   health: number;
   mana: number;
   xp: number;
   level: number;
   light: number;
   darkness: number;
}

export interface PlayerState {
   name: string;
   equippedItems: EquippedItems;
   usableItems: InventoryItem[];
   stats: Stats;
   spells: Spell[];
   money: number;
}
