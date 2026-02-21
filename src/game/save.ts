import * as fs from 'fs';
import type { GameState } from '../types.js';
import { SAVE_FILE_PATH } from '../constants.js';

interface SaveData {
  grid: GameState['grid'];
  inventory: GameState['inventory'];
  cursor: GameState['cursor'];
  tool: GameState['tool'];
  selectedSeed: GameState['selectedSeed'];
  weather: GameState['weather'];
  tickCount: GameState['tickCount'];
  dialogLog: GameState['dialogLog'];
  gridRows: number;
  gridCols: number;
}

export function saveGame(state: GameState): boolean {
  const data: SaveData = {
    grid: state.grid,
    inventory: state.inventory,
    cursor: state.cursor,
    tool: state.tool,
    selectedSeed: state.selectedSeed,
    weather: state.weather,
    tickCount: state.tickCount,
    dialogLog: state.dialogLog,
    gridRows: state.gridRows,
    gridCols: state.gridCols,
  };
  try {
    fs.writeFileSync(SAVE_FILE_PATH, JSON.stringify(data), 'utf-8');
    return true;
  } catch {
    return false;
  }
}

export function loadGame(): Partial<SaveData> | null {
  try {
    const raw = fs.readFileSync(SAVE_FILE_PATH, 'utf-8');
    return JSON.parse(raw) as Partial<SaveData>;
  } catch {
    return null;
  }
}

export function deleteSave(): boolean {
  try { fs.unlinkSync(SAVE_FILE_PATH); return true; } catch { return false; }
}

export function applySavedState(state: GameState, saved: Partial<SaveData>): void {
  if (saved.grid && saved.gridRows && saved.gridCols) {
    // Migrate old saves: convert river boolean to terrain
    for (const row of saved.grid) {
      for (const cell of row) {
        if ((cell as any).terrain === undefined) {
          (cell as any).terrain = (cell as any).river ? 'river' : 'soil';
          delete (cell as any).river;
        }
      }
    }
    state.grid = saved.grid;
    state.gridRows = saved.gridRows;
    state.gridCols = saved.gridCols;
  }
  if (saved.inventory) state.inventory = saved.inventory;
  if (saved.cursor) state.cursor = saved.cursor;
  if (saved.tool) state.tool = saved.tool;
  if (saved.selectedSeed) state.selectedSeed = saved.selectedSeed;
  if (saved.weather) state.weather = saved.weather;
  if (saved.tickCount !== undefined) state.tickCount = saved.tickCount;
  if (saved.dialogLog) state.dialogLog = saved.dialogLog;
}
