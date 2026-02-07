import type { GameState } from '../types.js';
import { PlantStage } from '../types.js';
import { createPlant } from './plant.js';
import { resolveHybridOffspring, resolveOffspringColorVariant } from '../data/hybrids.js';
import {
  PROPAGATION_CHANCE,
  PROPAGATION_MIN_AGE,
  PROPAGATION_WATER_THRESHOLD,
  PROPAGATION_OFFSPRING_WATER,
  WATER_DONATION_AMOUNT,
  WATER_DONATION_THRESHOLD,
  WATER_MAX,
} from '../constants.js';

// 8-directional neighbor offsets
const DIRS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1],
];

// 4-cardinal neighbor offsets
const CARDINAL = [
  [-1, 0], [1, 0], [0, -1], [0, 1],
];

interface PropagationEvent {
  row: number;
  col: number;
  speciesId: string;
  colorVariant: number;
}

interface WaterDonationEvent {
  row: number;
  col: number;
  amount: number;
}

export function propagationTick(state: GameState): void {
  const { grid, gridRows, gridCols } = state;
  const events: PropagationEvent[] = [];
  const claimed = new Set<string>(); // "row,col" keys to avoid conflicts

  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      const cell = grid[r][c];
      if (!cell.plant) continue;
      if (cell.plant.stage < PlantStage.Flowering) continue;
      if (cell.plant.age < PROPAGATION_MIN_AGE) continue;
      if (cell.waterLevel < PROPAGATION_WATER_THRESHOLD) continue;

      // Roll propagation chance
      if (Math.random() > PROPAGATION_CHANCE) continue;

      // Gather neighbors: empty cells and plant cells
      const emptyCells: [number, number][] = [];
      const plantNeighbors: [number, number][] = [];

      for (const [dr, dc] of DIRS) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= gridRows || nc < 0 || nc >= gridCols) continue;
        const neighbor = grid[nr][nc];
        if (neighbor.river) continue;

        if (neighbor.plant) {
          plantNeighbors.push([nr, nc]);
        } else {
          const key = `${nr},${nc}`;
          if (!claimed.has(key)) {
            emptyCells.push([nr, nc]);
          }
        }
      }

      // Need at least 1 empty cell and 1 plant neighbor
      if (emptyCells.length === 0 || plantNeighbors.length === 0) continue;

      // Pick random empty target
      const target = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      // Pick random plant neighbor as other parent
      const otherPos = plantNeighbors[Math.floor(Math.random() * plantNeighbors.length)];
      const otherPlant = grid[otherPos[0]][otherPos[1]].plant!;

      // Resolve offspring species
      let offspringSpecies: string | null;
      let colorVariant: number;

      if (cell.plant.speciesId === otherPlant.speciesId) {
        // Clone
        offspringSpecies = cell.plant.speciesId;
        colorVariant = resolveOffspringColorVariant(
          cell.plant.colorVariant,
          otherPlant.colorVariant,
          offspringSpecies,
        );
      } else {
        offspringSpecies = resolveHybridOffspring(cell.plant.speciesId, otherPlant.speciesId);
        if (!offspringSpecies) continue;
        colorVariant = resolveOffspringColorVariant(
          cell.plant.colorVariant,
          otherPlant.colorVariant,
          offspringSpecies,
        );
      }

      const key = `${target[0]},${target[1]}`;
      claimed.add(key);
      events.push({
        row: target[0],
        col: target[1],
        speciesId: offspringSpecies,
        colorVariant,
      });
    }
  }

  // Apply all events
  for (const event of events) {
    const cell = grid[event.row][event.col];
    if (cell.plant || cell.river) continue; // double-check
    cell.plant = createPlant(event.speciesId, event.colorVariant);
    cell.waterLevel = Math.min(WATER_MAX, cell.waterLevel + PROPAGATION_OFFSPRING_WATER);
  }
}

export function waterDonationTick(state: GameState): void {
  const { grid, gridRows, gridCols } = state;
  const events: WaterDonationEvent[] = [];

  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      const cell = grid[r][c];
      if (!cell.plant) continue;
      if (cell.waterLevel < WATER_DONATION_THRESHOLD) continue;

      // Donate to cardinal neighbors
      for (const [dr, dc] of CARDINAL) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= gridRows || nc < 0 || nc >= gridCols) continue;
        const neighbor = grid[nr][nc];
        if (neighbor.river) continue;

        events.push({
          row: nr,
          col: nc,
          amount: WATER_DONATION_AMOUNT,
        });
      }
    }
  }

  // Apply all donations
  for (const event of events) {
    const cell = grid[event.row][event.col];
    cell.waterLevel = Math.min(WATER_MAX, cell.waterLevel + event.amount);
  }
}
