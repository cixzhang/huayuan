import type { GameState, Position } from '../types.js';
import { ToolType, PlantStage } from '../types.js';
import { createPlant } from './plant.js';
import { hasSeed, removeSeed, addSeed } from './inventory.js';
import { getCell } from './grid.js';
import { getSpecies } from '../data/plants.js';
import { WATER_AMOUNT, WATER_MAX, MESSAGE_DURATION_TICKS } from '../constants.js';

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

function plantSeed(state: GameState, cell: ReturnType<typeof getCell> & {}, _pos: Position): void {
  if (cell.river) {
    setMessage(state, 'Cannot plant in the river!');
    return;
  }

  if (cell.plant) {
    setMessage(state, 'Cell already occupied!');
    return;
  }

  if (!hasSeed(state.inventory, state.selectedSeed)) {
    const species = getSpecies(state.selectedSeed);
    setMessage(state, `No ${species?.name || ''} seeds left!`);
    return;
  }

  removeSeed(state.inventory, state.selectedSeed);
  cell.plant = createPlant(state.selectedSeed);
  const species = getSpecies(state.selectedSeed);
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
  // Harvesting gives back 2 seeds
  addSeed(state.inventory, cell.plant.speciesId, 2);
  cell.plant = null;
  setMessage(state, `Harvested ${species?.hanzi || ''}! +2 seeds`);
}

export function useToolOnArea(state: GameState, minR: number, maxR: number, minC: number, maxC: number): void {
  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      useTool(state, { row: r, col: c });
    }
  }
}
