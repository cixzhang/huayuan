import { enterFullScreen, exitFullScreen, onResize, getTerminalSize } from './terminal/screen.js';
import { startInput, stopInput } from './terminal/input.js';
import { InputManager } from './input/inputManager.js';
import { createGameState, resizeGameState } from './game/gameState.js';
import { GameLoop } from './game/gameLoop.js';

function main(): void {
  const state = createGameState();
  const inputManager = new InputManager();

  let exiting = false;

  function cleanup(): void {
    if (exiting) return;
    exiting = true;
    gameLoop.stop();
    stopInput();
    exitFullScreen();
  }

  const gameLoop = new GameLoop(state, () => {
    cleanup();
    process.exit(0);
  });

  // Enter full-screen terminal mode
  enterFullScreen();

  // Handle resize
  onResize((size) => {
    resizeGameState(state, size.rows, size.cols);
    gameLoop.resizeRenderer(state.gridRows, state.gridCols);
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
