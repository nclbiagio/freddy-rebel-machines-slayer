import { InventoryItem, Item, Spell } from '../../models/EquipmentAndStats';

export type InspectedItem = { type: 'item'; data: Item | InventoryItem } | { type: 'spell'; data: Spell } | null;
