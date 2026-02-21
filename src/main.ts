import { exitFullScreen, onResize, getTerminalSize } from './terminal/screen.js';
import { clearScreen, hideCursor, moveTo } from './terminal/ansi.js';
import { startInput, stopInput } from './terminal/input.js';
import { InputManager } from './input/inputManager.js';
import { createGameState, type MapType } from './game/gameState.js';
import { GameLoop } from './game/gameLoop.js';
import { AudioSystem } from './audio/audioSystem.js';
import { CELL_WIDTH, HUD_ROWS, MAP_ROWS, MAP_COLS, MESSAGE_DURATION_TICKS } from './constants.js';
import { loadGame, applySavedState, deleteSave } from './game/save.js';
import { showTitleScreen } from './render/titleScreen.js';
import { loadSettings } from './game/settings.js';
import type { SaveInfo } from './render/titleScreen.js';

function computeGrownSpeciesIds(grid: { plant: { speciesId: string } | null }[][]): Set<string> {
  const ids = new Set<string>();
  for (const row of grid) {
    for (const cell of row) {
      if (cell.plant) {
        ids.add(cell.plant.speciesId);
      }
    }
  }
  return ids;
}

function parseMapType(choice: string): MapType {
  if (choice === 'start:beach') return 'beach';
  if (choice === 'start:lake') return 'lake';
  return 'river';
}

async function main(): Promise<void> {
  let state = createGameState();

  // Load saved game if available
  let saved = loadGame();
  if (saved) {
    applySavedState(state, saved);
  }

  // Create audio system early so title screen can use it
  const audioSystem = new AudioSystem();
  audioSystem.init();

  // Load settings and apply mute
  const settings = loadSettings();
  audioSystem.setMuted(!settings.soundEnabled);

  // Title screen loop
  while (true) {
    let saveInfo: SaveInfo | null = null;
    if (saved) {
      saveInfo = {
        grid: state.grid,
        tickCount: state.tickCount,
        grownSpeciesIds: computeGrownSpeciesIds(state.grid),
      };
    }

    const choice = await showTitleScreen(saveInfo, audioSystem, settings);

    if (choice === 'quit') {
      audioSystem.cleanup();
      exitFullScreen();
      process.exit(0);
    }

    if (choice === 'delete_save') {
      deleteSave();
      saved = null;
      state = createGameState();
      continue;
    }

    // choice starts with 'start:'
    if (!saved) {
      const mapType = parseMapType(choice);
      state = createGameState(mapType);
    }
    break;
  }

  // Apply pinyin setting
  state.showPinyin = settings.showPinyin;

  // Prepare screen for game
  if (saved) {
    state.message = 'Game loaded';
    state.messageExpiry = state.tickCount + MESSAGE_DURATION_TICKS;
  }

  process.stdout.write(clearScreen + hideCursor + moveTo(0, 0));

  const inputManager = new InputManager();

  let exiting = false;

  function cleanup(): void {
    if (exiting) return;
    exiting = true;
    gameLoop.stop();
    audioSystem.cleanup();
    stopInput();
    exitFullScreen();
  }

  // Compute viewport dimensions that fit the terminal (account for border: 2 rows, 2 cols)
  const termSize = getTerminalSize();
  const viewRows = Math.min(termSize.rows - HUD_ROWS - 2, MAP_ROWS);
  const viewCols = Math.min(Math.floor((termSize.cols - 2) / CELL_WIDTH), MAP_COLS);

  const gameLoop = new GameLoop(state, () => {
    cleanup();
    process.exit(0);
  }, viewRows, viewCols, audioSystem);

  // Apply weather effects setting
  gameLoop.setWeatherEffectsEnabled(settings.weatherEffectsEnabled);

  // Draw centered border
  gameLoop.drawBorder(termSize.rows, termSize.cols);

  // Handle resize: only resize the renderer viewport, not the grid
  onResize((size) => {
    const newViewRows = Math.min(size.rows - HUD_ROWS - 2, MAP_ROWS);
    const newViewCols = Math.min(Math.floor((size.cols - 2) / CELL_WIDTH), MAP_COLS);
    process.stdout.write(clearScreen);
    gameLoop.drawBorder(size.rows, size.cols);
    gameLoop.resizeRenderer(newViewRows, newViewCols);
  });

  // Handle graceful exit
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', () => {
    // Ensure terminal is restored even on unexpected exit
    if (!exiting) {
      exitFullScreen();
    }
  });

  // Start input handling
  startInput((key) => {
    inputManager.handleKey(key);

    // Sync input mode to game state
    state.mode = inputManager.mode;
    state.commandBuffer = inputManager.getCommandBuffer();

    // Drain actions and process immediately
    const actions = inputManager.drainActions();
    gameLoop.processActions(actions);

    // Sync back: game loop may have changed the mode
    inputManager.mode = state.mode;
  });

  // Start the game loop
  gameLoop.start();
}

main();
