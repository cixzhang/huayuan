import type { GameState, Cell, WeatherState } from '../types.js';
import { InputMode, ToolType, WeatherType, PlantStage } from '../types.js';
import { createGrid } from './grid.js';
import { createInventory } from './inventory.js';
import { createPlant } from './plant.js';
import { MAP_ROWS, MAP_COLS, WEATHER_MIN_DURATION, WEATHER_MAX_DURATION } from '../constants.js';
import { SEED_ORDER } from '../data/plants.js';
import { getSpecies } from '../data/plants.js';
import { createDefaultDialogState } from './birds.js';

function generateRiver(grid: Cell[][], rows: number, cols: number): void {
  // River meanders diagonally from top-left area to bottom-right area
  // using a smooth S-curve
  const seed = Math.floor(Math.random() * 1000);

  // Start near top-left quadrant, end near bottom-right quadrant
  const startCol = Math.floor(cols * 0.2);
  const endCol = Math.floor(cols * 0.8);

  let prevCenter = -1;
  for (let r = 0; r < rows; r++) {
    const t = r / (rows - 1); // 0..1 progress down the map

    // Linear interpolation from startCol to endCol
    const baseCol = startCol + (endCol - startCol) * t;

    // Add Perlin-like S-curve wobble
    const wobble1 = Math.sin((r + seed) * 0.3) * 3;
    const wobble2 = Math.sin((r + seed) * 0.7) * 1.5;
    const wobble = wobble1 + wobble2;

    let centerCol = Math.round(baseCol + wobble);

    // Clamp so center never jumps more than 1 column from previous row
    // This guarantees connectivity even at width-1 segments
    if (prevCenter >= 0) {
      centerCol = Math.max(prevCenter - 1, Math.min(prevCenter + 1, centerCol));
    }
    prevCenter = centerCol;

    // River width: 1-3 cells, wider at bends
    const bendStrength = Math.abs(Math.cos((r + seed) * 0.3) * 0.9);
    const width = bendStrength > 0.6 ? 3 : bendStrength > 0.3 ? 2 : 1;
    const halfWidth = Math.floor(width / 2);

    for (let dc = -halfWidth; dc <= halfWidth; dc++) {
      const c = centerCol + dc;
      if (c >= 0 && c < cols) {
        grid[r][c].river = true;
        grid[r][c].waterLevel = 100;
      }
    }
  }
}

function generateLake(grid: Cell[][], rows: number, cols: number): void {
  // Find the river's midpoint column
  const midRow = Math.floor(rows / 2);
  let riverMidCol = -1;
  for (let c = 0; c < cols; c++) {
    if (grid[midRow][c].river) {
      riverMidCol = c;
      break;
    }
  }
  if (riverMidCol < 0) return;

  // Offset the lake slightly from the river midpoint
  const lakeCenterRow = midRow;
  const lakeCenterCol = riverMidCol + 2;

  // Carve a roughly 5x7 oval
  const radiusR = 2.5;
  const radiusC = 3.5;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const dr = (r - lakeCenterRow) / radiusR;
      const dc = (c - lakeCenterCol) / radiusC;
      if (dr * dr + dc * dc <= 1.0) {
        grid[r][c].river = true;
        grid[r][c].waterLevel = 100;
      }
    }
  }

  // Leave a 2x2 island in the center
  for (let dr = 0; dr <= 1; dr++) {
    for (let dc = 0; dc <= 1; dc++) {
      const r = lakeCenterRow + dr;
      const c = lakeCenterCol + dc;
      if (r >= 0 && r < rows && c >= 0 && c < cols) {
        grid[r][c].river = false;
        grid[r][c].waterLevel = 50; // Moist from being surrounded by water
      }
    }
  }
}

function generateForest(grid: Cell[][], rows: number, cols: number): void {
  // Place a cluster of ~8-12 mature trees in the top-left corner
  const species = getSpecies('tree');
  if (!species) return;

  const numVariants = species.colorVariants.length;
  const forestSize = 8 + Math.floor(Math.random() * 5); // 8-12 trees
  let placed = 0;
  const startRow = 1;
  const startCol = 1;
  const clusterRadius = 4;

  // Try to place trees in a cluster
  for (let attempt = 0; attempt < 100 && placed < forestSize; attempt++) {
    const r = startRow + Math.floor(Math.random() * clusterRadius * 2);
    const c = startCol + Math.floor(Math.random() * clusterRadius * 2);

    if (r >= 0 && r < rows && c >= 0 && c < cols) {
      const cell = grid[r][c];
      if (!cell.river && !cell.plant) {
        const plant = createPlant('tree', Math.floor(Math.random() * numVariants));
        // Set to Flowering stage (mature tree)
        plant.stage = PlantStage.Flowering;
        plant.age = 50;
        plant.growthProgress = 0;
        cell.plant = plant;
        cell.waterLevel = 40; // Trees have some water
        placed++;
      }
    }
  }
}

function scatterWildPlants(grid: Cell[][], rows: number, cols: number): void {
  const wildChars = ['〳', '丿', '╮', '╭', '◌', '╰'];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];
      // Skip cells with river, plants, or near forest (top-left corner)
      if (cell.river || cell.plant) continue;
      if (r < 10 && c < 10) continue; // Skip near forest area

      // ~15-20% chance
      if (Math.random() < 0.17) {
        cell.wildChar = wildChars[Math.floor(Math.random() * wildChars.length)];
      }
    }
  }
}

export function createGameState(): GameState {
  const gridRows = MAP_ROWS;
  const gridCols = MAP_COLS;

  const grid = createGrid(gridRows, gridCols);
  generateRiver(grid, gridRows, gridCols);
  generateLake(grid, gridRows, gridCols);
  generateForest(grid, gridRows, gridCols);
  scatterWildPlants(grid, gridRows, gridCols);

  const weather: WeatherState = {
    current: WeatherType.Neutral,
    intensity: 1.0,
    ticksInState: 0,
    stateDuration: WEATHER_MIN_DURATION + Math.floor(Math.random() * (WEATHER_MAX_DURATION - WEATHER_MIN_DURATION + 1)),
    isNight: false,
    nightPhase: 0,
    dayNightTimer: 4,  // start past dawn ramp-down window (<=3) so nightPhase=0
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
    birds: [],
    nextBirdId: 1,
    dialog: createDefaultDialogState(),
  };
}
