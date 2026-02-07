import type { PlantSpecies } from '../types.js';

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
  },
};

export const SEED_ORDER = ['grass', 'flower', 'tree'];

export function getSpecies(id: string): PlantSpecies | undefined {
  return PLANT_SPECIES[id];
}
