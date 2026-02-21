import type { Cell, GameState, Position } from '../types.js';

export function createGrid(rows: number, cols: number): Cell[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      waterLevel: 0,
      plant: null,
      terrain: 'soil',
      wildChar: null,
    }))
  );
}

export function getCell(state: GameState, pos: Position): Cell | null {
  const { row, col } = pos;
  if (row >= 0 && row < state.gridRows && col >= 0 && col < state.gridCols) {
    return state.grid[row][col];
  }
  return null;
}

export function isInBounds(state: GameState, pos: Position): boolean {
  return pos.row >= 0 && pos.row < state.gridRows &&
         pos.col >= 0 && pos.col < state.gridCols;
}

export function clampPosition(state: GameState, pos: Position): Position {
  return {
    row: Math.max(0, Math.min(state.gridRows - 1, pos.row)),
    col: Math.max(0, Math.min(state.gridCols - 1, pos.col)),
  };
}
