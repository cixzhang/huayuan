import type { GameState, WeatherState } from '../types.js';
import { InputMode, ToolType, WeatherType } from '../types.js';
import { createGrid } from './grid.js';
import { createInventory } from './inventory.js';
import { CELL_WIDTH, HUD_ROWS, MIN_GRID_COLS, MIN_GRID_ROWS, WEATHER_MIN_DURATION, WEATHER_MAX_DURATION } from '../constants.js';
import { getTerminalSize } from '../terminal/screen.js';
import { SEED_ORDER } from '../data/plants.js';

function generateRiver(grid: import('../types.js').Cell[][], rows: number, cols: number): void {
  // Place river roughly 1/3 from the right, meandering vertically
  let col = Math.floor(cols * 0.65);
  const seed = (rows * 7 + cols * 13) % 97;

  for (let r = 0; r < rows; r++) {
    // Gentle meander based on a simple deterministic pattern
    const drift = Math.sin((r + seed) * 0.4) * 1.5;
    const c = Math.round(col + drift);
    if (c >= 0 && c < cols) {
      grid[r][c].river = true;
      grid[r][c].waterLevel = 100;
    }
    // Occasionally widen the river to 2 cells
    if (r % 3 === 0 && c + 1 < cols) {
      grid[r][c + 1].river = true;
      grid[r][c + 1].waterLevel = 100;
    }
  }
}

export function createGameState(): GameState {
  const size = getTerminalSize();
  const gridCols = Math.max(MIN_GRID_COLS, Math.floor(size.cols / CELL_WIDTH));
  const gridRows = Math.max(MIN_GRID_ROWS, size.rows - HUD_ROWS);

  const grid = createGrid(gridRows, gridCols);
  generateRiver(grid, gridRows, gridCols);

  const weather: WeatherState = {
    current: WeatherType.Clear,
    intensity: 1.0,
    ticksInState: 0,
    stateDuration: WEATHER_MIN_DURATION + Math.floor(Math.random() * (WEATHER_MAX_DURATION - WEATHER_MIN_DURATION + 1)),
    isNight: false,
    nightPhase: 0,
    dayNightTimer: 0,
  };

  return {
    grid,
    gridRows,
    gridCols,
    cursor: { row: Math.floor(gridRows / 2), col: Math.floor(gridCols / 2) },
    selection: null,
    mode: InputMode.Normal,
    tool: ToolType.Plant,
    selectedSeed: SEED_ORDER[0],
    inventory: createInventory(),
    showHelp: false,
    commandBuffer: '',
    tickCount: 0,
    message: '',
    messageExpiry: 0,
    weather,
  };
}

export function resizeGameState(state: GameState, termRows: number, termCols: number): void {
  const newCols = Math.max(MIN_GRID_COLS, Math.floor(termCols / CELL_WIDTH));
  const newRows = Math.max(MIN_GRID_ROWS, termRows - HUD_ROWS);

  while (state.grid.length < newRows) {
    state.grid.push(
      Array.from({ length: newCols }, () => ({ waterLevel: 0, plant: null, river: false }))
    );
  }
  state.grid.length = newRows;

  for (let r = 0; r < newRows; r++) {
    while (state.grid[r].length < newCols) {
      state.grid[r].push({ waterLevel: 0, plant: null, river: false });
    }
    state.grid[r].length = newCols;
  }

  state.gridRows = newRows;
  state.gridCols = newCols;

  state.cursor.row = Math.min(state.cursor.row, newRows - 1);
  state.cursor.col = Math.min(state.cursor.col, newCols - 1);
}
