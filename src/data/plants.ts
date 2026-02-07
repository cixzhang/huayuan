import type { PlantSpecies } from '../types.js';
import { HYBRID_SPECIES } from './hybrids.js';

export const PLANT_SPECIES: Record<string, PlantSpecies> = {
  grass: {
    id: 'grass',
    name: 'Grass',
    stages: ['◦', '芽', 'ˇ', 'ϒ', '草'],
    growthTicks: [2, 3, 4, 5],
    waterNeed: 5,
    hanzi: '草',
    pinyin: 'cǎo',
    english: 'grass',
    hybridLevel: 0,
    colorVariants: [
      [229, 156, 46, 48, 82],
      [229, 156, 46, 84, 118],
      [229, 156, 34, 48, 76],
      [229, 156, 46, 42, 78],
      [229, 156, 40, 48, 82],
      [229, 156, 46, 48, 120],
    ],
  },
  flower: {
    id: 'flower',
    name: 'Flower',
    stages: ['◦', '芽', '⚜', '❀', '花'],
    growthTicks: [3, 4, 5, 6],
    waterNeed: 8,
    hanzi: '花',
    pinyin: 'huā',
    english: 'flower',
    hybridLevel: 0,
    colorVariants: [
      [229, 156, 46, 213, 201],
      [229, 156, 46, 207, 200],
      [229, 156, 46, 219, 213],
      [229, 156, 46, 175, 169],
      [229, 156, 46, 213, 207],
      [229, 156, 46, 177, 171],
    ],
  },
  tree: {
    id: 'tree',
    name: 'Tree',
    stages: ['◦', '芽', '〴', '♣', '木'],
    growthTicks: [4, 6, 8, 10],
    waterNeed: 12,
    hanzi: '木',
    pinyin: 'mù',
    english: 'tree',
    hybridLevel: 0,
    colorVariants: [
      [229, 156, 46, 49, 85],
      [229, 156, 46, 22, 58],
      [229, 156, 34, 49, 85],
      [229, 156, 46, 64, 100],
      [229, 156, 40, 49, 85],
      [229, 156, 46, 28, 64],
    ],
  },
};

// Register all hybrids into the main species map
Object.assign(PLANT_SPECIES, HYBRID_SPECIES);

export const SEED_ORDER = ['grass', 'flower', 'tree'];

export function getSpecies(id: string): PlantSpecies | undefined {
  return PLANT_SPECIES[id];
}
