import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { BirdType } from '../types.js';
import type { DialogTree, GameState, SeedRewardType } from '../types.js';
import { HYBRID_SPECIES } from './hybrids.js';
import { DIALOG_POOL } from './dialog.js';

// Merge static dialogs with any generated ones
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALL_DIALOGS: DialogTree[] = [...DIALOG_POOL];
try {
  const genPath = path.resolve(__dirname, './dialog-generated.json');
  const raw = fs.readFileSync(genPath, 'utf-8');
  const parsed = JSON.parse(raw);
  if (parsed.dialogs && Array.isArray(parsed.dialogs)) {
    ALL_DIALOGS.push(...(parsed.dialogs as DialogTree[]));
  }
} catch {
  // No generated dialogs file — that's fine
}

// === Bird Type Definitions ===

export interface BirdTypeDef {
  type: BirdType;
  name: string;
  hanzi: string;
  pinyin: string;
  color256: number;
  isWaterBird: boolean;    // duck & goose can land on water
  art: string[];           // 4-line ASCII art for dialog
  artOnWater: string[];    // variant art when resting on water (water birds only)
}

export const BIRD_TYPES: BirdTypeDef[] = [
  {
    type: BirdType.Robin,
    name: 'Robin',
    hanzi: '知更鸟',
    pinyin: 'zhīgēngniǎo',
    color256: 196,
    isWaterBird: false,
    // 9 chars wide × 4 lines
    art: [
      '  ⌠      ',
      ' <∙▓     ',
      '  ⁑░▒▓╱  ',
      '   ⸔⸔    ',
    ],
    artOnWater: [],
  },
  {
    type: BirdType.Sparrow,
    name: 'Sparrow',
    hanzi: '麻雀',
    pinyin: 'máquè',
    color256: 172,
    isWaterBird: false,
    art: [
      '  ᴗ      ',
      " '∙'     ",
      '  ░▒▓ᗕ   ',
      '   ╯╯    ',
    ],
    artOnWater: [],
  },
  {
    type: BirdType.Duck,
    name: 'Duck',
    hanzi: '鸭子',
    pinyin: 'yāzi',
    color256: 159,
    isWaterBird: true,
    art: [
      '   ◞     ',
      ' <∘@     ',
      '   ░░▒▓◸ ',
      '    ><    ',
    ],
    artOnWater: [
      '   ◞     ',
      ' <∘@     ',
      '   ░░▒▓◸ ',
      '~ ~≈~~≈≈~',
    ],
  },
  {
    type: BirdType.Goose,
    name: 'Goose',
    hanzi: '鹅',
    pinyin: 'é',
    color256: 220,
    isWaterBird: true,
    art: [
      ' ⸦∙▓     ',
      '   ░     ',
      '   ░▒▓▓◜ ',
      '    ᨓ    ',
    ],
    artOnWater: [
      ' ⸦∙▓     ',
      '   ░     ',
      '   ░▒▓▓◜ ',
      '~ ≈~~ ≈~~',
    ],
  },
];

export function getBirdTypeDef(type: BirdType): BirdTypeDef {
  return BIRD_TYPES[type];
}

// === Map Characters ===
// Flying left: alternates ◤ and ◣
// Flying right: alternates ◥ and ◢
// Resting: ◆

export function birdMapChar(birdState: 'flying' | 'resting' | 'leaving', direction: 'left' | 'right', animFrame: number): string {
  if (birdState === 'resting') return '◆';
  const flap = animFrame % 2;
  if (direction === 'left') {
    return flap === 0 ? '◤' : '◣';
  }
  return flap === 0 ? '◥' : '◢';
}

// === Dialog Filtering ===

function countPlants(state: GameState): number {
  let count = 0;
  for (let r = 0; r < state.gridRows; r++) {
    for (let c = 0; c < state.gridCols; c++) {
      if (state.grid[r][c].plant) count++;
    }
  }
  return count;
}

export function getValidDialogs(state: GameState): DialogTree[] {
  const plantCount = countPlants(state);
  return ALL_DIALOGS.filter(d => {
    if (!d.conditions) return true;
    if (d.conditions.weather !== undefined && d.conditions.weather !== state.weather.current) return false;
    if (d.conditions.isNight !== undefined && d.conditions.isNight !== state.weather.isNight) return false;
    if (d.conditions.minPlants !== undefined && plantCount < d.conditions.minPlants) return false;
    if (d.conditions.maxPlants !== undefined && plantCount > d.conditions.maxPlants) return false;
    return true;
  });
}

export function getDialogById(id: string): DialogTree | undefined {
  return ALL_DIALOGS.find(d => d.id === id);
}

// === Seed Reward Resolution ===

export function resolveSeedReward(rewardType: SeedRewardType, state: GameState): string {
  if (rewardType === 'random_base') {
    const bases = ['grass', 'flower', 'tree'];
    return bases[Math.floor(Math.random() * bases.length)];
  }

  if (rewardType === 'random_hybrid') {
    // Find hybrid or special species the player hasn't discovered yet
    const specials = ['lotus', 'cactus', 'moss', 'maple'];
    const allOptions = [...Object.keys(HYBRID_SPECIES), ...specials];
    const undiscovered = allOptions.filter(id => {
      const count = state.inventory.seeds[id] || 0;
      return count === 0;
    });
    if (undiscovered.length > 0) {
      return undiscovered[Math.floor(Math.random() * undiscovered.length)];
    }
    // Fall back to random base
    const bases = ['grass', 'flower', 'tree'];
    return bases[Math.floor(Math.random() * bases.length)];
  }

  // Specific species ID
  return rewardType;
}
