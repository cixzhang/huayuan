import type { GameState } from '../types.js';
import { PlantStage, WeatherType } from '../types.js';
import { createPlant } from './plant.js';
import { getSpecies } from '../data/plants.js';
import { resolveHybridOffspring, resolveOffspringColorVariant } from '../data/hybrids.js';
import {
  PROPAGATION_CHANCE,
  PROPAGATION_MIN_AGE,
  PROPAGATION_WATER_THRESHOLD,
  PROPAGATION_OFFSPRING_WATER,
  WATER_DONATION_AMOUNT,
  WATER_DONATION_THRESHOLD,
  WATER_MAX,
  MAPLE_WIND_PROPAGATION_CHANCE,
  ORCHID_PROPAGATION_PENALTY,
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
      // Skip special plants from hybrid propagation
      const species = getSpecies(cell.plant.speciesId);
      if (species?.special) continue;
      if (cell.plant.stage < PlantStage.Flowering) continue;
      if (cell.plant.age < PROPAGATION_MIN_AGE) continue;
      if (cell.waterLevel < PROPAGATION_WATER_THRESHOLD) continue;

      // Roll propagation chance (orchids are penalized)
      const chance = (species && species.hybridLevel >= 4)
        ? PROPAGATION_CHANCE * ORCHID_PROPAGATION_PENALTY
        : PROPAGATION_CHANCE;
      if (Math.random() > chance) continue;

      // Gather neighbors: empty cells and plant cells
      const emptyCells: [number, number][] = [];
      const plantNeighbors: [number, number][] = [];

      for (const [dr, dc] of DIRS) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= gridRows || nc < 0 || nc >= gridCols) continue;
        const neighbor = grid[nr][nc];
        if (neighbor.terrain === 'river') continue;

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
    if (cell.plant || cell.terrain === 'river') continue; // double-check
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
      // Cactus and palm don't donate water; sand cells don't donate
      const donorSpecies = getSpecies(cell.plant.speciesId);
      if (donorSpecies?.special === 'cactus' || donorSpecies?.special === 'palm') continue;
      if (cell.terrain === 'sand') continue;
      if (cell.waterLevel < WATER_DONATION_THRESHOLD) continue;

      // Donate to cardinal neighbors
      for (const [dr, dc] of CARDINAL) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= gridRows || nc < 0 || nc >= gridCols) continue;
        const neighbor = grid[nr][nc];
        if (neighbor.terrain === 'river' || neighbor.terrain === 'sand') continue;

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

export function specialPropagationTick(state: GameState): void {
  const { grid, gridRows, gridCols } = state;
  const events: PropagationEvent[] = [];
  const claimed = new Set<string>();

  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      const cell = grid[r][c];
      if (!cell.plant) continue;
      if (cell.plant.stage < PlantStage.Flowering) continue;
      if (cell.plant.age < PROPAGATION_MIN_AGE) continue;

      const species = getSpecies(cell.plant.speciesId);
      if (!species?.special) continue;

      const specialChance = (species.special === 'maple' && state.weather.current === WeatherType.Wind)
        ? MAPLE_WIND_PROPAGATION_CHANCE
        : PROPAGATION_CHANCE;
      if (Math.random() > specialChance) continue;

      // Find valid target cells based on special type
      const targets: [number, number][] = [];

      for (const [dr, dc] of DIRS) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= gridRows || nc < 0 || nc >= gridCols) continue;
        const neighbor = grid[nr][nc];
        if (neighbor.plant) continue;
        const key = `${nr},${nc}`;
        if (claimed.has(key)) continue;

        if (species.special === 'lotus') {
          // Target: empty river tile adjacent to at least 1 non-river cell
          if (neighbor.terrain !== 'river') continue;
          let adjLand = false;
          for (const [dr2, dc2] of CARDINAL) {
            const nr2 = nr + dr2;
            const nc2 = nc + dc2;
            if (nr2 < 0 || nr2 >= gridRows || nc2 < 0 || nc2 >= gridCols) continue;
            if (grid[nr2][nc2].terrain !== 'river') { adjLand = true; break; }
          }
          if (!adjLand) continue;
        } else if (species.special === 'cactus') {
          // Target: empty non-river tile with water < 25
          if (neighbor.terrain === 'river') continue;
          if (neighbor.waterLevel >= 25) continue;
        } else if (species.special === 'palm') {
          // Target: empty sand tile with water < 25
          if (neighbor.terrain !== 'sand') continue;
          if (neighbor.waterLevel >= 25) continue;
        } else if (species.special === 'moss') {
          // Target: empty non-river tile adjacent to a tree (stage >= Mature)
          if (neighbor.terrain === 'river') continue;
          let adjTree = false;
          for (const [dr2, dc2] of CARDINAL) {
            const nr2 = nr + dr2;
            const nc2 = nc + dc2;
            if (nr2 < 0 || nr2 >= gridRows || nc2 < 0 || nc2 >= gridCols) continue;
            const adj = grid[nr2][nc2];
            if (adj.plant) {
              const adjSpecies = getSpecies(adj.plant.speciesId);
              if (adjSpecies?.id === 'tree' && adj.plant.stage >= PlantStage.Mature) {
                adjTree = true;
                break;
              }
            }
          }
          if (!adjTree) continue;
        } else if (species.special === 'maple') {
          // Target: only propagates when the weather is windy
          if (state.weather.current !== WeatherType.Wind) continue;
        }

        targets.push([nr, nc]);
      }

      if (targets.length === 0) continue;

      const target = targets[Math.floor(Math.random() * targets.length)];
      const key = `${target[0]},${target[1]}`;
      claimed.add(key);

      // Clone parent color variant (with small mutation chance)
      let colorVariant = cell.plant.colorVariant;
      if (Math.random() < 0.1 && species.colorVariants.length > 1) {
        colorVariant = Math.floor(Math.random() * species.colorVariants.length);
      }

      events.push({
        row: target[0],
        col: target[1],
        speciesId: species.id,
        colorVariant,
      });
    }
  }

  // Apply events
  for (const event of events) {
    const cell = grid[event.row][event.col];
    if (cell.plant) continue;
    // Lotus goes on river, palm on sand, others on non-river land
    const species = getSpecies(event.speciesId);
    if (species?.special === 'lotus') {
      if (cell.terrain !== 'river') continue;
    } else if (species?.special === 'palm') {
      if (cell.terrain !== 'sand') continue;
    } else {
      if (cell.terrain === 'river') continue;
    }
    cell.plant = createPlant(event.speciesId, event.colorVariant);
    if (species?.special !== 'lotus') {
      cell.waterLevel = Math.min(WATER_MAX, cell.waterLevel + PROPAGATION_OFFSPRING_WATER);
    }
  }
}
