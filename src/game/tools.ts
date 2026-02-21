import type { GameState, Position } from '../types.js';
import { ToolType, PlantStage } from '../types.js';
import { createPlant } from './plant.js';
import { hasSeed, removeSeed, addSeed } from './inventory.js';
import { getCell, isInBounds } from './grid.js';
import { getSpecies } from '../data/plants.js';
import { getBaseParents } from '../data/hybrids.js';
import { WATER_AMOUNT, WATER_MAX, MESSAGE_DURATION_TICKS } from '../constants.js';

const CARDINAL_DIRS: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];

function setMessage(state: GameState, msg: string): void {
  state.message = msg;
  state.messageExpiry = state.tickCount + MESSAGE_DURATION_TICKS;
}

export function useTool(state: GameState, pos: Position): void {
  const cell = getCell(state, pos);
  if (!cell) return;

  switch (state.tool) {
    case ToolType.Plant:
      plantSeed(state, cell, pos);
      break;
    case ToolType.Water:
      waterCell(state, cell);
      break;
    case ToolType.Harvest:
      harvestPlant(state, cell);
      break;
  }
}

function plantSeed(state: GameState, cell: ReturnType<typeof getCell> & {}, pos: Position): void {
  const species = getSpecies(state.selectedSeed);

  // Special plant placement checks
  if (species?.special === 'lotus') {
    if (cell.terrain !== 'river') {
      setMessage(state, 'Lotus can only be planted in the river!');
      return;
    }
    if (cell.plant) {
      setMessage(state, 'Cell already occupied!');
      return;
    }
  } else if (species?.special === 'palm') {
    if (cell.terrain !== 'sand') {
      setMessage(state, 'Palm can only be planted on sand!');
      return;
    }
    if (cell.plant) {
      setMessage(state, 'Cell already occupied!');
      return;
    }
  } else if (species?.special === 'moss') {
    if (cell.terrain === 'river') {
      setMessage(state, 'Cannot plant in the river!');
      return;
    }
    if (cell.plant) {
      setMessage(state, 'Cell already occupied!');
      return;
    }
    // Must be adjacent to a tree at stage >= Mature
    let hasTree = false;
    for (const [dr, dc] of CARDINAL_DIRS) {
      const nr = pos.row + dr;
      const nc = pos.col + dc;
      if (!isInBounds(state, { row: nr, col: nc })) continue;
      const neighbor = state.grid[nr][nc];
      if (neighbor.plant) {
        const nSpecies = getSpecies(neighbor.plant.speciesId);
        if (nSpecies?.id === 'tree' && neighbor.plant.stage >= PlantStage.Mature) {
          hasTree = true;
          break;
        }
      }
    }
    if (!hasTree) {
      setMessage(state, 'Moss must be planted next to a mature tree!');
      return;
    }
  } else {
    // Normal plants (including cactus)
    if (cell.terrain === 'river') {
      setMessage(state, 'Cannot plant in the river!');
      return;
    }
    if (cell.plant) {
      setMessage(state, 'Cell already occupied!');
      return;
    }
  }

  if (!hasSeed(state.inventory, state.selectedSeed)) {
    setMessage(state, `No ${species?.name || ''} seeds left!`);
    return;
  }

  removeSeed(state.inventory, state.selectedSeed);
  cell.plant = createPlant(state.selectedSeed);
  setMessage(state, `Planted ${species?.hanzi || ''} ${species?.name || ''}`);
}

function waterCell(state: GameState, cell: ReturnType<typeof getCell> & {}): void {
  const oldLevel = cell.waterLevel;
  cell.waterLevel = Math.min(WATER_MAX, cell.waterLevel + WATER_AMOUNT);
  if (cell.waterLevel > oldLevel) {
    setMessage(state, `Watered! (${cell.waterLevel}%)`);
  } else {
    setMessage(state, 'Soil is fully saturated!');
  }
}

function harvestPlant(state: GameState, cell: ReturnType<typeof getCell> & {}): void {
  // Check for wild plants first
  if (cell.wildChar) {
    cell.wildChar = null;
    const baseSeeds = ['grass', 'flower', 'tree'];
    const awarded = baseSeeds[Math.floor(Math.random() * baseSeeds.length)];
    addSeed(state.inventory, awarded, 1);
    const species = getSpecies(awarded);
    setMessage(state, `Foraged a wild plant! +1 ${species?.name || awarded} seed`);
    return;
  }

  if (!cell.plant) {
    setMessage(state, 'Nothing to harvest here.');
    return;
  }

  if (cell.plant.stage < PlantStage.Flowering) {
    const species = getSpecies(cell.plant.speciesId);
    setMessage(state, `${species?.name || 'Plant'} not ready to harvest yet.`);
    return;
  }

  const species = getSpecies(cell.plant.speciesId);
  // Base species: 2 seeds of same type. Hybrids: 1 seed of each base parent.
  if (species && species.hybridLevel > 0) {
    const bases = getBaseParents(cell.plant.speciesId);
    for (const baseId of bases) {
      addSeed(state.inventory, baseId, 1);
    }
    const baseNames = bases.map(id => getSpecies(id)?.hanzi || id).join('+');
    cell.plant = null;
    setMessage(state, `Harvested ${species.hanzi}! +1 ${baseNames} seeds`);
  } else {
    addSeed(state.inventory, cell.plant.speciesId, 2);
    cell.plant = null;
    setMessage(state, `Harvested ${species?.hanzi || ''}! +2 seeds`);
  }
}

export function useToolOnArea(state: GameState, minR: number, maxR: number, minC: number, maxC: number): void {
  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      useTool(state, { row: r, col: c });
    }
  }
}
