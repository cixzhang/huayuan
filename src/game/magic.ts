import type { GameState, Plant, Terrain } from '../types.js';
import { getSpecies } from '../data/plants.js';

export function yankSelection(state: GameState): number {
  if (!state.selection) return 0;
  const sel = state.selection;
  const minR = Math.min(sel.anchor.row, sel.cursor.row);
  const maxR = Math.max(sel.anchor.row, sel.cursor.row);
  const minC = Math.min(sel.anchor.col, sel.cursor.col);
  const maxC = Math.max(sel.anchor.col, sel.cursor.col);

  const height = maxR - minR + 1;
  const width = maxC - minC + 1;
  const cells: (Plant | null)[][] = [];
  let count = 0;

  for (let r = 0; r < height; r++) {
    const row: (Plant | null)[] = [];
    for (let c = 0; c < width; c++) {
      const gr = minR + r;
      const gc = minC + c;
      const cell = state.grid[gr][gc];
      if (cell.plant) {
        row.push({ ...cell.plant });
        cell.plant = null;
        count++;
      } else {
        row.push(null);
      }
    }
    cells.push(row);
  }

  state.clipboard = { cells, width, height };
  state.selection = null;
  return count;
}

export function pasteClipboard(state: GameState): number {
  if (!state.clipboard) return 0;
  const { cells, width, height } = state.clipboard;
  const startR = state.cursor.row;
  const startC = state.cursor.col;
  let count = 0;

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      const gr = startR + r;
      const gc = startC + c;
      if (gr < 0 || gr >= state.gridRows || gc < 0 || gc >= state.gridCols) continue;
      const plant = cells[r][c];
      if (!plant) continue;
      const target = state.grid[gr][gc];
      if (target.terrain === 'river' || target.plant) continue;
      target.plant = { ...plant };
      count++;
    }
  }

  state.clipboard = null;
  return count;
}

export function deletePlants(state: GameState): number {
  if (!state.selection) return 0;
  const sel = state.selection;
  const minR = Math.min(sel.anchor.row, sel.cursor.row);
  const maxR = Math.max(sel.anchor.row, sel.cursor.row);
  const minC = Math.min(sel.anchor.col, sel.cursor.col);
  const maxC = Math.max(sel.anchor.col, sel.cursor.col);
  let count = 0;

  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      const cell = state.grid[r][c];
      if (cell.plant) {
        const speciesId = cell.plant.speciesId;
        if (!state.inventory.seeds[speciesId]) {
          state.inventory.seeds[speciesId] = 0;
        }
        state.inventory.seeds[speciesId]++;
        cell.plant = null;
        count++;
      }
    }
  }

  state.selection = null;
  return count;
}

export function deletePlantAtCursor(state: GameState): boolean {
  const cell = state.grid[state.cursor.row]?.[state.cursor.col];
  if (!cell?.plant) return false;
  const speciesId = cell.plant.speciesId;
  if (!state.inventory.seeds[speciesId]) {
    state.inventory.seeds[speciesId] = 0;
  }
  state.inventory.seeds[speciesId]++;
  cell.plant = null;
  return true;
}

function getCellDisplayChar(state: GameState, row: number, col: number): string | null {
  const cell = state.grid[row]?.[col];
  if (!cell) return null;
  if (cell.plant) {
    const species = getSpecies(cell.plant.speciesId);
    if (species) return species.stages[cell.plant.stage];
  }
  if (cell.wildChar) return cell.wildChar;
  return null;
}

export function findChar(state: GameState, char: string): boolean {
  // Scan outward from cursor in a spiral pattern to find nearest matching cell
  const { gridRows, gridCols, cursor } = state;
  let bestDist = Infinity;
  let bestPos: { row: number; col: number } | null = null;

  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      if (r === cursor.row && c === cursor.col) continue;
      const displayChar = getCellDisplayChar(state, r, c);
      if (displayChar && displayChar.includes(char)) {
        const dist = Math.abs(r - cursor.row) + Math.abs(c - cursor.col);
        if (dist < bestDist) {
          bestDist = dist;
          bestPos = { row: r, col: c };
        }
      }
    }
  }

  if (bestPos) {
    state.cursor = bestPos;
    return true;
  }
  return false;
}

const TERRAIN_CYCLE: Terrain[] = ['soil', 'sand', 'river'];

function terraformCell(cell: { terrain: Terrain; waterLevel: number; plant: Plant | null; wildChar: string | null }, newTerrain: Terrain): void {
  cell.terrain = newTerrain;
  if (newTerrain === 'river') {
    cell.waterLevel = 100;
    cell.plant = null;
    cell.wildChar = null;
  } else if (newTerrain === 'sand') {
    cell.waterLevel = 0;
    cell.plant = null;
    cell.wildChar = null;
  } else {
    cell.waterLevel = 0;
  }
}

export function terraform(state: GameState, targetTerrain?: string): void {
  let newTerrain: Terrain;
  if (targetTerrain && (targetTerrain === 'soil' || targetTerrain === 'sand' || targetTerrain === 'river')) {
    newTerrain = targetTerrain;
  } else {
    const cell = state.grid[state.cursor.row]?.[state.cursor.col];
    if (!cell) return;
    const idx = TERRAIN_CYCLE.indexOf(cell.terrain);
    newTerrain = TERRAIN_CYCLE[(idx + 1) % TERRAIN_CYCLE.length];
  }

  if (state.selection) {
    const sel = state.selection;
    const minR = Math.min(sel.anchor.row, sel.cursor.row);
    const maxR = Math.max(sel.anchor.row, sel.cursor.row);
    const minC = Math.min(sel.anchor.col, sel.cursor.col);
    const maxC = Math.max(sel.anchor.col, sel.cursor.col);
    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        const cell = state.grid[r]?.[c];
        if (cell) terraformCell(cell, newTerrain);
      }
    }
  } else {
    const cell = state.grid[state.cursor.row]?.[state.cursor.col];
    if (!cell) return;
    terraformCell(cell, newTerrain);
  }
}
