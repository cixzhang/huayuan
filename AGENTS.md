# Agents Guide

Guidelines for contributing to Huayuan (花园).

## Project Overview

Huayuan is a terminal-based garden simulation game with Chinese language learning. Players grow plants, interact with birds via quiz dialogs, and learn Chinese vocabulary.

## Code Style

- TypeScript strict mode, ES modules (`.js` extension in imports)
- No default exports; use named exports
- Use union types and enums for constrained values (e.g. `SeedRewardType`)
- Keep rendering logic in `src/render/`, game logic in `src/game/`, data in `src/data/`

## Dialog Conventions

See `docs/dialog-guidelines.md` for detailed dialog writing rules. Key points:
- "What does X mean?" questions use English-only answer options (empty `text` field)
- Never embed the answer in the question
- Target HSK 3 vocabulary with pinyin on all Chinese text

## Testing

- Run `npx tsc --noEmit` to verify type checking before committing
- Test visually by running the game: `npm start`
- Check that dialog text wraps correctly, clouds render as shapes, and HUD displays properly

## Architecture

- **Game loop** (`src/game/gameLoop.ts`): tick-based updates for growth, weather, birds
- **Renderer** (`src/render/renderer.ts`): layered rendering (ground, stems, flowers, birds, weather)
- **HUD** (`src/render/hud.ts`): 3-row status bar at bottom
- **Dialog** (`src/render/dialog.ts`): overlay box for bird conversations
- **Constants** (`src/constants.ts`): tuning values for timing, grid size, weather, birds
