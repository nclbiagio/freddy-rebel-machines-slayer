import { MapLocation } from '../../../models/Map';

// ID strings must match GameSceneTypes

export const worldMap: MapLocation[] = [
   {
      id: 'Level1',
      name: "Chapter 1: The Rebel Factory",
      icon: 'assets/icons/icon_chapter1.png',
      unlocked: true, 
      isCompleted: false,
      hasNewContent: true,
      visited: false,
      connectedTo: ['Level2'],
      subLocations: [],
      pos: {
         xPct: 30,
         yPct: 50,
      },
   },
   {
      id: 'Level2',
      name: 'Chapter 2: The Heart of the Acid',
      icon: 'assets/icons/icon_chapter2.png', 
      unlocked: false,
      isCompleted: false,
      hasNewContent: true,
      visited: false,
      connectedTo: ['Level1', 'Level3'],
      subLocations: [],
      pos: {
         xPct: 70,
         yPct: 50,
      },
   },
   {
      id: 'Level3',
      name: 'Chapter 3: The Deep Mine',
      icon: 'assets/icons/icon_chapter3.png',
      unlocked: false,
      isCompleted: false,
      hasNewContent: true,
      visited: false,
      connectedTo: ['Level2'],
      subLocations: [],
      pos: {
         xPct: 50,
         yPct: 20,
      },
   },
];
