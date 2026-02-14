import { exitFullScreen, onResize, getTerminalSize } from './terminal/screen.js';
import { clearScreen, hideCursor, moveTo } from './terminal/ansi.js';
import { startInput, stopInput } from './terminal/input.js';
import { InputManager } from './input/inputManager.js';
import { createGameState } from './game/gameState.js';
import { GameLoop } from './game/gameLoop.js';
import { AudioSystem } from './audio/audioSystem.js';
import { CELL_WIDTH, HUD_ROWS, MAP_ROWS, MAP_COLS, MESSAGE_DURATION_TICKS } from './constants.js';
import { generateDialog } from './dialog/dialogRefresh.js';
import { loadGame, applySavedState } from './game/save.js';
import { showTitleScreen } from './render/titleScreen.js';

async function main(): Promise<void> {
  const state = createGameState();

  // Load saved game if available
  const saved = loadGame();
  if (saved) {
    applySavedState(state, saved);
  }

  // Title screen loop
  while (true) {
    const choice = await showTitleScreen(saved ? {
      grid: state.grid,
      tickCount: state.tickCount,
    } : null);

    if (choice === 'quit') {
      exitFullScreen();
      process.exit(0);
    }

    if (choice === 'dialog_add' || choice === 'dialog_replace') {
      exitFullScreen();
      await generateDialog(choice === 'dialog_add' ? 'add' : 'replace');
      continue;
    }

    // choice === 'start'
    break;
  }

  // Prepare screen for game
  if (saved) {
    state.message = 'Game loaded';
    state.messageExpiry = state.tickCount + MESSAGE_DURATION_TICKS;
  }

  process.stdout.write(clearScreen + hideCursor + moveTo(0, 0));

  const inputManager = new InputManager();
  const audioSystem = new AudioSystem();
  audioSystem.init();

  let exiting = false;

  function cleanup(): void {
    if (exiting) return;
    exiting = true;
    gameLoop.stop();
    audioSystem.cleanup();
    stopInput();
    exitFullScreen();
  }

  // Compute viewport dimensions that fit the terminal
  const termSize = getTerminalSize();
  const viewRows = Math.min(termSize.rows - HUD_ROWS, MAP_ROWS);
  const viewCols = Math.min(Math.floor(termSize.cols / CELL_WIDTH), MAP_COLS);

  const gameLoop = new GameLoop(state, () => {
    cleanup();
    process.exit(0);
  }, viewRows, viewCols, audioSystem);

  // Handle resize: only resize the renderer viewport, not the grid
  onResize((size) => {
    const newViewRows = Math.min(size.rows - HUD_ROWS, MAP_ROWS);
    const newViewCols = Math.min(Math.floor(size.cols / CELL_WIDTH), MAP_COLS);
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
