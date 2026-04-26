# Integrazione Tiled - Documentazione Tecnica

Questo documento riassume tutte le interconnessioni tra il codice e Tiled Map Editor, specificando quali proprietà custom sono utilizzate e dove.

## 1. Caricamento Mappe

Le mappe vengono caricate in `src/scenes/loadAssets/LoadAssets.ts` come file JSON.
I tileset devono chiamarsi `ground` per essere riconosciuti automaticamente dal codice di collisione in `src/core/ai/PathFinder.ts`.

## 2. Proprietà Oggetti (Object Layers)

Il progetto utilizza diverse proprietà custom (Custom Properties) sugli oggetti di Tiled per definire il comportamento delle entità.
La funzione helper principale è `getObjectPropValueFromTiled` in `src/core/utils/Common.ts`.

### 2.1 Nemici (Enemies)

**Layer Tiled**: Oggetti che spawnano nemici.
**File Gestione**: `src/sprites/Enemy.ts` e `src/entities/` (es. `LordOfPlagues.ts`).

| Proprietà | Tipo   | Descrizione                                        | Valori Comuni                            | Default      |
| :-------- | :----- | :------------------------------------------------- | :--------------------------------------- | :----------- |
| `type`    | String | Definisce il comportamento dell'IA                 | `dumb`, `chasing`, `firing`, `following` | `dumb`       |
| `being`   | String | Definisce la sprite/razza del nemico               | `plague`, `lordOfPlagues`                | `plague`     |
| `pathId`  | String | ID univoco per collegare il nemico al suo percorso | Es: `guardia_nord`                       | `''` (vuoto) |

### 2.2 Percorsi (Paths)

**Layer Tiled**: Punti (Point Objects) che definiscono i percorsi.
**File Gestione**: `src/core/ai/PathFinder.ts` e `src/core/ai/PathFollower.ts`.

| Proprietà | Tipo   | Descrizione                                     | Note                                       |
| :-------- | :----- | :---------------------------------------------- | :----------------------------------------- |
| `Name`    | String | Usato per ordinare i punti del percorso         | Rinominare in sequenza (es. `p1`, `p2`)    |
| `pathId`  | String | ID per collegare il punto a un nemico specifico | Deve combaciare con il `pathId` del nemico |

### 2.3 Forzieri (Chests)

**Layer Tiled**: Oggetti forziere.
**File Gestione**: `src/scenes/chest/Chest.ts` (o Factories dedicate).

| Proprietà | Tipo   | Descrizione      | Valori                                                 | Default     |
| :-------- | :----- | :--------------- | :----------------------------------------------------- | :---------- |
| `type`    | String | Tipo di forziere | `baseChest`, `bronzeChest`, `silverChest`, `goldChest` | `baseChest` |

### 2.4 Umani / NPC (Humans)

**Layer Tiled**: NPC con cui interagire.
**File Gestione**: `src/sprites/Human.ts`.

| Proprietà | Tipo   | Descrizione           | Valori                    |
| :-------- | :----- | :-------------------- | :------------------------ |
| `type`    | String | Tipo di sprite/NPC    | `baseWoman`, `baseMan`    |
| `message` | String | ID dei messaggi (CSV) | Es: `msg_hello,msg_quest` |

## 3. Layer e Collisioni

**File Gestione**: `src/core/ai/PathFinder.ts`

-  **Terrain**: Il codice cerca un tileset chiamato `ground`.
-  **Walkable**: Se un tile non ha proprietà, è camminabile.
-  **Collides**: Se un tile ha la proprietà custom `collides: true`, è un ostacolo.
-  **Cost**: Se un tile ha la proprietà custom `cost: numero`, influenza il pathfinding (costo di movimento).

## 4. Exit Zones

**File Gestione**: `src/core/utils/Common.ts` ( `setPositionBasedOnExitRooms`)
Gli oggetti che definiscono le uscite verso altri livelli usano le coordinate `x` e `y` per calcolare dove spawnare il player nella stanza successiva.
