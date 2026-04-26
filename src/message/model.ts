import { GameSceneTypes } from '../GameService';

export interface OpenMessageOptions {
   showCloseIcon?: boolean;
}

export interface ImagesConfig {
   maxHeightVh?: number;
}

// Definizione della struttura dei dati per una scena
export interface Message {
   id: string;
   sceneId: GameSceneTypes;
   playerId: string; // 👈 ID del personaggio controllato dal giocatore
   background: string; // Path dell'immagine di sfondo (ad esempio, "bg/forest.png")
   content: MessageContent[]; // Array di contenuti da visualizzare nella scena (es. dialoghi, caption, scelte)
   characters?: Character[]; // Lista dei personaggi che appaiono nella scena, ce ne deve essere almeno uno che rappresenta il player,
   // considera che posizione nell'array identificherà la posizione anche a schermo
   transition?: 'fadeIn' | 'fadeOut' | 'slideUp' | 'none'; // Tipo di transizione (opzionale), es. "fadeIn", "fadeOut"
   next?: SceneReference; // ← viene usato solo se content non gestisce già l'uscita, può essere sia l'id di un messaggio del flusso o una nuova scena PhaserJs
   // Il nextId viene usato solo quando non ci sono Choice o Outcome a fine contenuto.
   imagesConfig?: ImagesConfig;
   bgm?: string; // Chiave Phaser per la musica di sottofondo (Background Music)
   bgAnimated?: boolean; // Se true, lo sfondo viene trattato come uno spritesheet animato (8 frame)
   frames?: number; // Numero di frame nello spritesheet (default 8)
}

// Definizione di un personaggio
export interface Character {
   id: string; // Identificativo del personaggio (ad esempio, "alice", "bob")
   name?: string; // Nome visualizzato (opzionale)
   image: string; // Path dell'immagine del personaggio (es. "characters/alice.png")
   expression?: string; // Espressione facciale (opzionale), es. "happy", "angry"
   position?: 'left' | 'center' | 'right' | 'background'; //Il personaggio principale è sempre a sinistra mentre gli altri si posizionano a destra
   animated?: boolean; // Se true, l'immagine viene trattata come uno spritesheet animato (8 frame di default)
   frames?: number; // Numero di frame nello spritesheet (default 8)
}

// Definizione dei contenuti della scena (dialoghi, scelte, caption)
export type MessageContent = Caption | Dialogue | Choice | CombatChoice | Outcome;

// Definizione di una Caption (testo descrittivo della scena)
export interface Caption {
   type: 'caption'; // Tipo di contenuto (fisso, in questo caso "caption")
   text: string; // Testo della caption da visualizzare
   image?: string; // Path dell'immagine di sfondo
   transition?: string; // Tipo di transizione per la caption (opzionale)
   sfx?: string; // Chiave Phaser per l'effetto sonoro
}

// Definizione di un Dialogo (messaggi di dialogo tra personaggi)
export interface Dialogue {
   type: 'dialogue'; // Tipo di contenuto (fisso, in questo caso "dialogue")
   speaker: string; // ID del personaggio che parla (collegato a "Character.id")
   text: string; // Testo del dialogo
   transition?: string; // Tipo di transizione per il dialogo (opzionale)
   sfx?: string; // Chiave Phaser per l'effetto sonoro
}

// Definizione di una Scelta (possibili azioni del giocatore)
export interface Choice {
   type: 'choice'; // Tipo di contenuto (fisso, in questo caso "choice")
   choices: ChoiceOption[]; // Lista di opzioni di scelta
   text?: string; // Testo esplicativo
}

export interface CombatChoice {
   type: 'combatChoice'; // Identifica il blocco come combattimento a scelte
   enemy: string; // Nome o tipo del nemico (es. "Goblin")
   description: string; // Testo introduttivo
   choices: CombatChoiceOption[]; // Azioni possibili
}

export interface CombatChoiceOption {
   text: string; // Azione (es. "Attacca", "Scappa")
   next: SceneReference; // Prossimo blocco o scena
   onChosen?: (data?: any) => void; // Modifica stato (statistiche, inventario, ecc.)
}

export interface Condition {
   type: 'stat' | 'inventory';
   key: string; // es: 'strength', 'experience', 'sword'
   operator: '>' | '>=' | '<' | '<=' | '===' | '!==';
   value: number | string | boolean;
}

// Definizione di un'opzione di scelta
export interface ChoiceOption {
   text: string; // Testo da mostrare all'utente
   next: SceneReference; // ID del messaggio successivo da caricare
   onChosen?: (data?: any) => void; // Callback da eseguire quando l'utente sceglie questa opzione (facoltativo), // Modifica stato (statistiche, inventario, ecc.)
   conditions?: Condition[];
   transition?: string; // Tipo di transizione per la scelta (opzionale)
   effectPreview?: string; // Es: "+10 Ombra", "Perdi fede", ecc.
   sfx?: string; // Chiave Phaser per l'effetto sonoro al click
}

export interface Outcome {
   type: 'outcome';
   summary: string; // Testo descrittivo dell'esito
   image?: string; // Path dell'immagine di sfondo
   transition?: string; // Transizione opzionale
   autoAdvance?: boolean; // Se true, passa automaticamente alla scena successiva
   delay?: number; // Millisecondi di attesa se autoAdvance è true
   next?: SceneReference; //Id della scena Phaser successiva o messaggio
   sfx?: string; // Chiave Phaser per l'effetto sonoro
}

export type SceneReference =
   | { type: 'scene'; id: GameSceneTypes | null; msgId?: string; callbackScene?: () => void }
   | { type: 'combatScene'; id: GameSceneTypes | null; enemyId: string; nextScene: GameSceneTypes }
   //if you provide a LocationId this means that you've already chosen a place in the world main map and you want to travel into a subLocation map
   | { type: 'worldMap'; locationId?: GameSceneTypes | null }
   | { type: 'message'; id: string };

export interface FlyMessageModel {
   key: string;
   text: string;
   duration?: number;
}

export type FlyMessagesType = 'scene_' | 'utils_' | 'error_';

export interface InteractMessageModel {
   id: string; // Entity ID (e.g. openGate)
   message: string; // e.g. "Open"
   closeKey: string; // e.g. "E"
}
