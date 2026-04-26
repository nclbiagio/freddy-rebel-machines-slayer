# Future Improvements & Technical Debt

## Architecture / Refactoring

-  [ ] **Refactor Enemy Persistence Logic**:

   -  **Context**: Currently, `LevelStore` loads _all_ enemy properties (type, pathId, etc.) from storage if available. This overrides any changes made to the Tiled map (static data) after the first save, which can block updates/patches from taking effect on existing saves.
   -  **Proposal**: Separate "Static Data" (from Tiled) and "Dynamic Data" (from Store).
      -  **Load from Tiled**: `type`, `being`, `pathId`, `spritesheet` (defines _who_ the enemy is).
      -  **Load from Store**: `x`, `y`, `hp`, `status` (defines _how_ the enemy is).
   -  **Benefit**: Allows patching levels (e.g., changing an enemy type) without breaking existing save files or requiring a wipe.

-  [ ] **Refactor MessageUtils Throttling**:
   -  **Context**: Currently, throttling for repetitive messages (e.g., "safe zone blocked") is handled manually in individual scenes (e.g., `SafePoint.ts`).
   -  **Proposal**: Implement temporal throttling directly in `MessageUtils.addFlyMessage`.
      -  Maintain a map of `key -> timestamp`.
      -  Ignore messages if called too soon after the last occurrence of the same key.
   -  **Benefit**: cleaner code in scenes and consistent UX behavior globally.
