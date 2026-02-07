import type { GameState, RenderCell } from '../../types.js';
import { soilFgBg, riverFgBg, soilBgForWater } from '../palette.js';

// Re-export for stem/flower layers
export const soilBg = soilBgForWater;

// Deterministic hash for per-cell variation
function cellHash(row: number, col: number): number {
  return ((row * 2654435761) ^ (col * 2246822519)) >>> 0;
}

// --- Soil textures ---
const DRY_CHARS = ['.', '·', ',', '`', '.', ' ', '·', ' '];
const DAMP_CHARS = ['░', '·', '░', '.', '░', '░', '·', '░'];
const MOIST_CHARS = ['▒', '░', '▒', '▒', '░', '▒', '▒', '░'];
const WET_CHARS = ['▓', '▒', '▓', '▓', '▓', '▒', '▓', '▓'];

function soilChar(level: number, row: number, col: number): string {
  const h = cellHash(row, col) % 8;
  if (level >= 60) return WET_CHARS[h];
  if (level >= 30) return MOIST_CHARS[h];
  if (level > 0) return DAMP_CHARS[h];
  return DRY_CHARS[h];
}

// --- River ---
const RIVER_CHARS = ['~', '≈', '~', '≈', '~', '∽', '~', '≈'];

export function renderGroundLayer(state: GameState): RenderCell[][] {
  const { grid, gridRows, gridCols } = state;
  const layer: RenderCell[][] = [];

  for (let r = 0; r < gridRows; r++) {
    const row: RenderCell[] = [];
    for (let c = 0; c < gridCols; c++) {
      const cell = grid[r][c];
      const h = cellHash(r, c);

      if (cell.river) {
        const charIdx = (h + r) % RIVER_CHARS.length;
        const colors = riverFgBg(h);
        row.push({ char: RIVER_CHARS[charIdx], fg: colors.fg, bg: colors.bg, style: '' });
      } else {
        const colors = soilFgBg(cell.waterLevel, h);
        const char = soilChar(cell.waterLevel, r, c);
        row.push({ char, fg: colors.fg, bg: colors.bg, style: '' });
      }
    }
    layer.push(row);
  }

  return layer;
}
