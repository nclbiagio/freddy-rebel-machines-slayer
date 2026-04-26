import { Item, Spell } from '../../models/EquipmentAndStats';

export const ItemCatalog: Record<string, Item> = {
   baseSword: {
      key: 'baseSword',
      name: 'Spada Base',
      type: 'weapon',
      stats: { strength: 2 },
      icon: 'icons/sword-basic.png',
      stackable: false,
   },
   dragonWrath: {
      key: 'dragonWrath',
      name: 'Ira del Drago',
      type: 'weapon',
      stats: { strength: 10, speed: -1 },
      icon: 'icons/sword-dragon.png',
      stackable: false,
   },
   healthPotion: {
      key: 'healthPotion',
      name: 'Pozione di Vita',
      type: 'potion',
      effects: { health: 25 },
      icon: 'icons/potion-red.png',
      stackable: true,
   },
   bloodArmor: {
      key: 'bloodArmor',
      name: 'Armatura del Sangue',
      type: 'armor',
      stats: { defense: 6 },
      icon: 'icons/armor-blood.png',
      stackable: false,
   },
   pathLight: {
      key: 'pathLight',
      name: 'Bastone della Luce',
      type: 'weapon',
      stats: { strength: 10 },
      icon: 'icons/staff-light.png',
      stackable: false,
   },
   chestKey: {
      key: 'chestKey',
      name: 'Chiave',
      type: 'key',
      icon: 'icons/key-silver.png',
      stackable: true,
   },
   goldenKey: {
      key: 'goldenKey',
      name: 'Chiave Dorata',
      type: 'key',
      icon: 'icons/key-gold.png',
      stackable: true,
   },
};

export const SpellCatalog: Record<string, Spell> = {
   fire_bolt: {
      id: 'fire_bolt',
      name: 'Dardo di Fuoco',
      cost: 5,
      icon: 'spell_fire.png',
      dmgMin: 14,
      dmgMax: 22,
   },
   shadow_grasp: {
      id: 'shadow_grasp',
      name: 'Presa d’Ombra',
      cost: 8,
      icon: 'spell_shadow.png',
      dmgMin: 20,
      dmgMax: 28,
   },
};
