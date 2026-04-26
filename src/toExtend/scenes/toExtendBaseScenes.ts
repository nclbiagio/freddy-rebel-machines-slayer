import { MapScene } from './map/MapScene';
import { LevelCompleteScene } from './levelComplete/LevelComplete';
import { Level1Scene } from './level1/Level1';
import { Level2Scene } from './level2/Level2';
import { Level3Scene } from './level3/Level3';
import { Level0Scene } from './level0/Level0';
import { IntroPrologueScene } from './prologue/IntroPrologue';
import { EndingScene } from './ending/EndingScene';

//import specific game scenes here, do not rename or changes file name and variable, when change game reset to an empty array
export const toExtendBaseScenes = [MapScene, LevelCompleteScene, Level1Scene, Level2Scene, Level3Scene, Level0Scene, IntroPrologueScene, EndingScene];
