import type { Plant, Cell } from '../types.js';
import { PlantStage } from '../types.js';
import { getSpecies } from '../data/plants.js';
import { WATER_THRESHOLD } from '../constants.js';

export function createPlant(speciesId: string): Plant {
  return {
    speciesId,
    stage: PlantStage.Seed,
    waterLevel: 0,
    growthProgress: 0,
    age: 0,
  };
}

export function growPlant(cell: Cell): void {
  const plant = cell.plant;
  if (!plant) return;

  const species = getSpecies(plant.speciesId);
  if (!species) return;

  plant.age++;

  // Already at max stage
  if (plant.stage >= PlantStage.Flowering) return;

  // Needs water to grow
  if (cell.waterLevel < WATER_THRESHOLD) return;

  // Consume water
  cell.waterLevel = Math.max(0, cell.waterLevel - species.waterNeed);

  // Advance growth progress
  plant.growthProgress++;

  // Check for stage advancement
  const ticksNeeded = species.growthTicks[plant.stage];
  if (plant.growthProgress >= ticksNeeded) {
    plant.stage++;
    plant.growthProgress = 0;
  }
}
