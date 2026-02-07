import { GameActionType, InputMode } from '../types.js';
import type { KeyPress } from '../terminal/input.js';

export interface KeyBinding {
  action: GameActionType;
  payload?: unknown;
}

const normalMap: Record<string, GameActionType> = {
  h: GameActionType.MoveLeft,
  j: GameActionType.MoveDown,
  k: GameActionType.MoveUp,
  l: GameActionType.MoveRight,
  left: GameActionType.MoveLeft,
  down: GameActionType.MoveDown,
  up: GameActionType.MoveUp,
  right: GameActionType.MoveRight,
  w: GameActionType.JumpRight,
  b: GameActionType.JumpLeft,
  space: GameActionType.UseTool,
  tab: GameActionType.CycleTool,
  s: GameActionType.CycleSeed,
  v: GameActionType.EnterVisual,
  '1': GameActionType.SelectTool1,
  '2': GameActionType.SelectTool2,
  '3': GameActionType.SelectTool3,
};

const visualMap: Record<string, GameActionType> = {
  h: GameActionType.MoveLeft,
  j: GameActionType.MoveDown,
  k: GameActionType.MoveUp,
  l: GameActionType.MoveRight,
  left: GameActionType.MoveLeft,
  down: GameActionType.MoveDown,
  up: GameActionType.MoveUp,
  right: GameActionType.MoveRight,
  w: GameActionType.JumpRight,
  b: GameActionType.JumpLeft,
  space: GameActionType.UseToolOnSelection,
  escape: GameActionType.ExitVisual,
};

export function resolveKey(key: KeyPress, mode: InputMode): GameActionType | null {
  // Ctrl+C always quits
  if (key.ctrl && key.name === 'c') {
    return GameActionType.Quit;
  }

  // ? toggles help in any mode
  if (key.sequence === '?') {
    return GameActionType.ToggleHelp;
  }

  if (mode === InputMode.Normal) {
    // : enters command mode
    if (key.sequence === ':') {
      return GameActionType.EnterCommand;
    }
    return normalMap[key.name] || normalMap[key.sequence] || null;
  }

  if (mode === InputMode.Visual) {
    return visualMap[key.name] || visualMap[key.sequence] || null;
  }

  return null;
}
