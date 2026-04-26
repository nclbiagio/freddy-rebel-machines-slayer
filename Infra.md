# Infrastructure Guide

This document is a technical guide to the project structure and architecture, designed to help developers understand the codebase and create future games using this engine.

## 1. Project Overview

The project is built using:

-  **Framework**: [Vue 3](https://vuejs.org/) (for UI and state management)
-  **Game Engine**: [Phaser 3](https://phaser.io/) (for rendering and game physics)
-  **Language**: [TypeScript](https://www.typescriptlang.org/)
-  **Build Tool**: [Vite](https://vitejs.dev/)

## 2. Directory Structure

The `src` directory is organized into modular layers:

### `src/core` (Engine Layer)

Reusable, game-agnostic code.

-  **`ai/`**: Pathfinding (`PathFinder.ts`) and AI logic (`PathFollower.ts`).
-  **`audio/`**: Sound management (`MusicTracker.ts`).
-  **`graphics/`**: Rendering utilities (`AnimationService.ts`, `LightUtils.ts`, `Explosion.ts`, `Effects.ts`).
-  **`input/`**: Input handling (Mouse, Keyboard).
-  **`utils/`**: General utilities (`Common.ts`).

### `src/game` (Game Logic Layer)

Specific implementations for the current game.

-  **`factories/`**: Logic to spawn entities from Tiled objects (`HumanFactory`, `EnemyFactory`).
-  **`state/`**: Global state management (`LevelStore`, `PlayerState`).
-  **`modules/`**: Large systems like `story`, `turnCombat`, `worldMap`.

### `src/scenes` (Phaser Scenes)

Each game screen or level is a Scene.

-  **`loadAssets/`**: Preloads images, audio, and JSONs.
-  **`menuStart/`**: Main menu.
-  **`sandBox/`** & **`_template/`**: Test levels and base scene templates.

### `src/sprites` (Game Objects)

Phaser GameObjects with visual and physical properties.

-  `Player.ts`, `Enemy.ts`, `Human.ts`, `Weapon.ts`.

### `src/models` (Type Definitions)

Shared TypeScript interfaces.

-  `Entity.ts`, `Game.ts`, `Map.ts`.

## 3. Key Services

### `GameService`

A Singleton that manages the game instance, global configuration, and scene transitions.

-  **Usage**: `GameService.getInstance()`

### `LevelStore` & `PlayerState`

Manage persistent data (player stats, inventory, current level) using Vue's reactivity system or Observables.

## 4. Tiled Integration workflow

1. **Create Map**: Use Tiled to create a `.json` map.
2. **Add Objects**: Use Object Layers to define functionality (Enemies, Chests, NPCs).
3. **Define Properties**: Add Custom Properties to objects (e.g., `type: 'chasing'`, `pathId: 'p1'`).
4. **Load in Code**:
   -  Add the JSON to `LoadAssets.ts`.
   -  In your Scene, call factory methods (e.g., `createEnemies`, `createHumans`) which parse the Object Layer and instantiate the correct Sprites.

See [TiledIntegration.md](TiledIntegration.md) for property details.
