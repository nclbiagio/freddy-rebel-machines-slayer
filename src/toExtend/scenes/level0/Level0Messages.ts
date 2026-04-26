import { Message } from '../../../message/model';

export const Level0Messages = {
   welcome: 'Welcome Freddy! Use WASD to move around.',
   shoot: 'Aim at the magnet: Left Click to shoot and hook the cable.',
   drag: 'Got it! Drag it to the machine. Right Click to release it wherever you want.',
   sequenceInfo: 'Watch the LEDs: you must connect the cables following the ORDER and COLOR shown!',
   inverterLore: 'These are Inverter Cables. Connecting them will reset and reboot the machines, making them harmless once again!',
   connect: 'Left Click on the socket to connect it. Right Click to detach it.',
   completed: 'Great job! Now save us all.',
};

export const getLevel0DialogueMessages = (assetsPath: string = 'assets/'): Message[] => {
   const commander = {
      id: 'commander',
      name: 'Commander',
      image: `${assetsPath}spritesheet/commander_garage_talking.png`,
      animated: true,
   };

   return [
      {
         id: 'level0_welcome',
         sceneId: 'Level0',
         playerId: 'freddy',
         background: ``,
         characters: [commander],
         content: [{ type: 'dialogue', speaker: 'commander', text: Level0Messages.welcome }],
         next: { type: 'scene', id: 'Level0' },
      },
      {
         id: 'level0_sequence',
         sceneId: 'Level0',
         playerId: 'freddy',
         background: ``,
         characters: [commander],
         content: [
            { type: 'dialogue', speaker: 'commander', text: Level0Messages.sequenceInfo },
            { type: 'dialogue', speaker: 'commander', text: Level0Messages.inverterLore },
            { type: 'dialogue', speaker: 'commander', text: Level0Messages.connect },
         ],
         next: { type: 'scene', id: 'Level0' },
      },
      {
         id: 'level0_victory',
         sceneId: 'Level0',
         playerId: 'freddy',
         background: '',
         characters: [commander],
         content: [{ type: 'dialogue', speaker: 'commander', text: Level0Messages.completed }],
         next: { type: 'scene', id: 'Level0' },
      },
   ];
};
