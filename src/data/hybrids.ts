import type { PlantSpecies } from '../types.js';

// === Hybrid Species Definitions ===
// Level 1: base×base combinations
// Level 2: level1×any
// Level 3: level2×any
// Level 4: level3×any

export const HYBRID_SPECIES: Record<string, PlantSpecies> = {
  fang: {
    id: 'fang',
    name: 'Fragrant',
    stages: ['◦', '芽', '⌇', '❋', '芳'],
    growthTicks: [3, 4, 5, 6],
    waterNeed: 7,
    hanzi: '芳',
    pinyin: 'fāng',
    english: 'fragrant',
    hybridLevel: 1,
    colorVariants: [
      [229, 156, 46, 48, 82],
      [229, 156, 78, 84, 120],
      [229, 156, 46, 213, 177],
      [229, 156, 114, 48, 156],
      [229, 156, 46, 120, 84],
      [229, 156, 78, 213, 201],
    ],
    parentSpecies: ['grass', 'flower'],
  },
  miao: {
    id: 'miao',
    name: 'Seedling',
    stages: ['◦', '芽', '⌇', '⌘', '苗'],
    growthTicks: [3, 5, 6, 7],
    waterNeed: 8,
    hanzi: '苗',
    pinyin: 'miáo',
    english: 'seedling',
    hybridLevel: 1,
    colorVariants: [
      [229, 156, 46, 49, 85],
      [229, 156, 46, 48, 119],
      [229, 156, 34, 49, 157],
      [229, 156, 78, 85, 121],
      [229, 156, 46, 83, 47],
      [229, 156, 114, 49, 85],
    ],
    parentSpecies: ['grass', 'tree'],
  },
  guo: {
    id: 'guo',
    name: 'Fruit',
    stages: ['◦', '芽', '❋', '⚘', '果'],
    growthTicks: [4, 5, 6, 7],
    waterNeed: 10,
    hanzi: '果',
    pinyin: 'guǒ',
    english: 'fruit',
    hybridLevel: 1,
    colorVariants: [
      [229, 156, 46, 213, 201],
      [229, 156, 46, 214, 208],
      [229, 156, 46, 49, 196],
      [229, 156, 46, 178, 172],
      [229, 156, 46, 220, 214],
      [229, 156, 46, 85, 203],
    ],
    parentSpecies: ['flower', 'tree'],
  },
  cha: {
    id: 'cha',
    name: 'Tea',
    stages: ['◦', '芽', '⌇', '⌘', '茶'],
    growthTicks: [4, 6, 7, 8],
    waterNeed: 9,
    hanzi: '茶',
    pinyin: 'chá',
    english: 'tea',
    hybridLevel: 2,
    colorVariants: [
      [229, 156, 46, 48, 82],
      [229, 156, 64, 107, 71],
      [229, 156, 46, 65, 29],
      [229, 156, 22, 28, 34],
      [229, 156, 46, 100, 106],
      [229, 156, 58, 64, 70],
    ],
    parentSpecies: ['fang', 'any'],
  },
  zhu: {
    id: 'zhu',
    name: 'Bamboo',
    stages: ['◦', '芽', '〡', '╽', '竹'],
    growthTicks: [4, 5, 7, 9],
    waterNeed: 10,
    hanzi: '竹',
    pinyin: 'zhú',
    english: 'bamboo',
    hybridLevel: 2,
    colorVariants: [
      [229, 156, 46, 49, 85],
      [229, 156, 34, 35, 77],
      [229, 156, 46, 71, 113],
      [229, 156, 22, 28, 70],
      [229, 156, 46, 107, 149],
      [229, 156, 64, 65, 107],
    ],
    parentSpecies: ['miao', 'any'],
  },
  tao: {
    id: 'tao',
    name: 'Peach',
    stages: ['◦', '芽', '⚘', '❀', '桃'],
    growthTicks: [5, 6, 8, 10],
    waterNeed: 11,
    hanzi: '桃',
    pinyin: 'táo',
    english: 'peach',
    hybridLevel: 2,
    colorVariants: [
      [229, 156, 46, 213, 201],
      [229, 156, 46, 218, 212],
      [229, 156, 46, 175, 169],
      [229, 156, 46, 211, 205],
      [229, 156, 46, 219, 213],
      [229, 156, 46, 176, 170],
    ],
    parentSpecies: ['guo', 'any'],
  },
  ju: {
    id: 'ju',
    name: 'Chrysanthemum',
    stages: ['◦', '芽', '⌇', '❁', '菊'],
    growthTicks: [5, 7, 9, 11],
    waterNeed: 14,
    hanzi: '菊',
    pinyin: 'jú',
    english: 'chrysanthemum',
    hybridLevel: 3,
    colorVariants: [
      [229, 156, 46, 220, 214],
      [229, 156, 46, 178, 172],
      [229, 156, 46, 221, 215],
      [229, 156, 46, 136, 130],
      [229, 156, 46, 184, 178],
      [229, 156, 46, 226, 220],
    ],
    parentSpecies: ['cha', 'any'],
  },
  mei: {
    id: 'mei',
    name: 'Plum Blossom',
    stages: ['◦', '芽', '⚘', '✿', '梅'],
    growthTicks: [5, 7, 9, 12],
    waterNeed: 13,
    hanzi: '梅',
    pinyin: 'méi',
    english: 'plum blossom',
    hybridLevel: 3,
    colorVariants: [
      [229, 156, 46, 213, 201],
      [229, 156, 46, 219, 213],
      [229, 156, 46, 175, 169],
      [229, 156, 46, 218, 212],
      [229, 156, 46, 176, 170],
      [229, 156, 46, 211, 205],
    ],
    parentSpecies: ['tao', 'any'],
  },
  lan: {
    id: 'lan',
    name: 'Orchid',
    stages: ['◦', '芽', 'ϒ', '❃', '蘭'],
    growthTicks: [6, 8, 10, 14],
    waterNeed: 15,
    hanzi: '蘭',
    pinyin: 'lán',
    english: 'orchid',
    hybridLevel: 4,
    colorVariants: [
      [229, 156, 46, 135, 129],
      [229, 156, 46, 141, 135],
      [229, 156, 46, 177, 171],
      [229, 156, 46, 99, 93],
      [229, 156, 46, 213, 207],
      [229, 156, 46, 147, 141],
    ],
    parentSpecies: ['ju', 'any'],
  },
};

// === Hybrid Lookup ===

// Level 1: specific base×base combinations (order-independent)
const BASE_CROSS_MAP: Record<string, string> = {
  'flower+grass': 'fang',
  'grass+flower': 'fang',
  'grass+tree': 'miao',
  'tree+grass': 'miao',
  'flower+tree': 'guo',
  'tree+flower': 'guo',
};

// Level 2+: higher-level parent determines offspring
const UPGRADE_MAP: Record<string, string> = {
  fang: 'cha',
  miao: 'zhu',
  guo: 'tao',
  cha: 'ju',
  zhu: 'ju',
  tao: 'mei',
  ju: 'lan',
  mei: 'lan',
};

export function resolveHybridOffspring(speciesA: string, speciesB: string): string | null {
  // Same species → clone (handled by caller)
  if (speciesA === speciesB) return speciesA;

  // Check base×base cross
  const key = `${speciesA}+${speciesB}`;
  if (BASE_CROSS_MAP[key]) return BASE_CROSS_MAP[key];

  // For level 2+, use the higher-level parent
  const spA = HYBRID_SPECIES[speciesA] || null;
  const spB = HYBRID_SPECIES[speciesB] || null;
  const levelA = spA?.hybridLevel ?? 0;
  const levelB = spB?.hybridLevel ?? 0;

  // Pick the higher-level species for upgrade
  const higherSpecies = levelA >= levelB ? speciesA : speciesB;

  if (UPGRADE_MAP[higherSpecies]) return UPGRADE_MAP[higherSpecies];

  // lan (level 4) crossed with anything → lan clone
  if (higherSpecies === 'lan') return 'lan';

  return null;
}

// === Color Variant Blending ===

export function resolveOffspringColorVariant(
  parentVariantA: number,
  parentVariantB: number,
  offspringSpeciesId: string,
): number {
  const species = HYBRID_SPECIES[offspringSpeciesId];
  if (!species || species.colorVariants.length === 0) return 0;

  const maxVariant = species.colorVariants.length;
  const roll = Math.random();

  if (roll < 0.7) {
    // 70% blend: average of parent indices, clamped to valid range
    const avg = Math.round((parentVariantA + parentVariantB) / 2);
    return avg % maxVariant;
  } else if (roll < 0.9) {
    // 20% random
    return Math.floor(Math.random() * maxVariant);
  } else {
    // 10% mutation: random variant different from both parents
    let v = Math.floor(Math.random() * maxVariant);
    // Try to pick one different from both parents
    for (let i = 0; i < 3; i++) {
      if (v !== parentVariantA % maxVariant && v !== parentVariantB % maxVariant) break;
      v = Math.floor(Math.random() * maxVariant);
    }
    return v;
  }
}

// === Base Parent Lookup (for harvest) ===

const BASE_SPECIES = new Set(['grass', 'flower', 'tree']);

export function getBaseParents(speciesId: string): string[] {
  if (BASE_SPECIES.has(speciesId)) return [speciesId];

  const species = HYBRID_SPECIES[speciesId];
  if (!species?.parentSpecies) return [speciesId];

  const result = new Set<string>();

  function walk(id: string): void {
    if (BASE_SPECIES.has(id)) {
      result.add(id);
      return;
    }
    if (id === 'any') return;
    const sp = HYBRID_SPECIES[id];
    if (!sp?.parentSpecies) return;
    walk(sp.parentSpecies[0]);
    walk(sp.parentSpecies[1]);
  }

  walk(speciesId);

  // If we found bases, return them; otherwise return the species itself
  return result.size > 0 ? Array.from(result) : [speciesId];
}
