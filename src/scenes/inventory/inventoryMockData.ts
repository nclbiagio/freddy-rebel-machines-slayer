import { EquippedItems, InventoryItem, Item } from '../../models/EquipmentAndStats';

export const usableItemsMock: InventoryItem[] = [
   {
      id: 'mock-potion-uuid',
      baseItem: {
         key: 'healthPotion',
         name: 'Pozione di Vita',
         type: 'potion',
         effects: { health: 25 },
         icon: 'icons/potion-red.png',
         stackable: true,
      },
      quantity: 5,
   },
   {
      id: 'mock-armor-uuid',
      baseItem: {
         key: 'bloodArmor',
         name: 'Armatura del Sangue',
         type: 'armor',
         stats: { defense: 6 },
         icon: 'icons/armor-blood.png',
         stackable: false,
      },
      quantity: 1,
   },
   {
      id: 'mock-sword-uuid',
      baseItem: {
         key: 'baseSword',
         name: 'Spada Base',
         type: 'weapon',
         stats: { strength: 2 },
         icon: 'icons/sword-basic.png',
         stackable: false,
      },
      quantity: 1,
   },
];

export const equippedItems: EquippedItems = {
   armor: null,
   primaryWeapon: {
      id: '12345', // Instance UUID
      baseItem: {
         key: 'dragonWrath',
         name: 'Ira del Drago',
         type: 'weapon',
         stats: { strength: 10, speed: -1 },
         icon: 'icons/sword-dragon.png',
         stackable: false,
      },
      quantity: 1,
   },
   primarySpell: null,
   accessories: [],
};

export const spells = [
   {
      id: 'spl001',
      name: 'Palla di Fuoco',
      description: 'Lancia una palla infuocata che brucia il nemico.',
      manaCost: 10,
      icon: 'icons/potion-red.png', // Temporary icon
      dmgMin: 15,
      dmgMax: 25,
   },
];
