# Agents Guide

Guidelines for contributing to Huayuan (花园).

## Project Overview

Huayuan is a terminal-based garden game for learning Chinese vocabulary and Vim keybindings. Players grow plants (represented as Chinese characters), cross-pollinate hybrids across 4 tiers, interact with birds via Mandarin quiz dialogs, and manage terrain across three map types (beach, lake, river).

## Code Style

- TypeScript strict mode, ES modules (`.js` extension in imports)
- No default exports; use named exports
- Use union types and enums for constrained values (e.g. `SeedRewardType`, `MapType`)
- Keep rendering logic in `src/render/`, game logic in `src/game/`, data in `src/data/`
- Audio generation in `src/audio/`, input handling in `src/input/`
- Dialog generation in `src/dialog/`

## Dialog Conventions

See `docs/dialog-guidelines.md` for detailed dialog writing rules. Key points:
- "What does X mean?" questions use English-only answer options (empty `text` field)
- Never embed the answer in the question
- Target HSK 3 vocabulary with pinyin on all Chinese text
- Pinyin display can be toggled off in settings

## Testing

- Run `npx tsc --noEmit` to verify type checking before committing
- Test visually by running the game: `npm start`
- Check that dialog text wraps correctly, clouds render as shapes, and HUD displays properly
- Test all three map types from the title screen (beach, lake, river)

## Architecture

- **Entry point** (`bin/huayuan.js`): CLI entry, registers tsx for TypeScript runtime
- **Main** (`src/main.ts`): title screen loop, game initialization, settings application
- **Game loop** (`src/game/gameLoop.ts`): tick-based updates for growth, weather, birds
- **Game state** (`src/game/gameState.ts`): map generation per MapType, initial state creation
- **Renderer** (`src/render/renderer.ts`): layered rendering (ground, stems, flowers, birds, weather)
- **Title screen** (`src/render/titleScreen.ts`): menus for start, map select, settings, dialog generation
- **HUD** (`src/render/hud.ts`): 3-row status bar at bottom
- **Dialog** (`src/render/dialog.ts`): overlay box for bird conversations
- **Dialog log** (`src/render/dialogLog.ts`): scrollable history of past conversations
- **Magic** (`src/game/magic.ts`): yank/paste, terraform (supports visual selection), plant deletion
- **Constants** (`src/constants.ts`): tuning values for timing, grid size, weather, birds, file paths
- **Settings** (`src/game/settings.ts`): sound, weather FX, pinyin toggle (persisted to ~/.huayuan-settings.json)

## User Data

All user data is stored in the home directory (not relative to package):
- `~/.huayuan-save.json` -- game save
- `~/.huayuan-settings.json` -- settings
- `~/.huayuan-dialog.json` -- AI-generated dialog

## Packaging

The package ships TypeScript source directly — no build step. `tsx` is a runtime dependency that compiles on the fly via `bin/huayuan.js`.

**What gets published** (controlled by `files` in package.json):
- `bin/` -- CLI entry point
- `src/` -- TypeScript source
- `docs/` -- dialog guidelines (read at runtime for AI dialog generation)

**What stays out:** `tools/`, `tsconfig.json`, `.claude/`, `AGENTS.md`

**Publishing:**
```bash
npm login
npm pack --dry-run   # verify contents, no secrets
npm publish
```

**User install:**
```bash
npx huayuan              # run without installing
npm install -g huayuan   # install globally
```

**Important:** all user data paths (`~/.huayuan-*.json`) use `process.env.HOME`, not paths relative to the package. This ensures saves, settings, and generated dialog work regardless of install location.

## Tools (Development Only)

- `tools/wav-maker.ts` -- interactive TUI for tweaking sound parameters (see `tools/README.md`)
- Not included in the npm package
