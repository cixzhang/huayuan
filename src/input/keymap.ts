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
  t: GameActionType.Talk,
  '1': GameActionType.SelectTool1,
  '2': GameActionType.SelectTool2,
  '3': GameActionType.SelectTool3,
  p: GameActionType.Paste,
  x: GameActionType.DeletePlantAtCursor,
  G: GameActionType.JumpBottom,
};

const dialogMap: Record<string, GameActionType> = {
  '1': GameActionType.DialogSelect1,
  '2': GameActionType.DialogSelect2,
  '3': GameActionType.DialogSelect3,
  space: GameActionType.DialogAdvance,
  return: GameActionType.DialogAdvance,
  escape: GameActionType.DialogExit,
  j: GameActionType.DialogScrollDown,
  k: GameActionType.DialogScrollUp,
  down: GameActionType.DialogScrollDown,
  up: GameActionType.DialogScrollUp,
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
  y: GameActionType.Yank,
  d: GameActionType.DeletePlants,
};

const helpMap: Record<string, GameActionType> = {
  j: GameActionType.HelpScrollDown,
  k: GameActionType.HelpScrollUp,
  down: GameActionType.HelpScrollDown,
  up: GameActionType.HelpScrollUp,
  escape: GameActionType.HelpExit,
  q: GameActionType.HelpExit,
};

const logMap: Record<string, GameActionType> = {
  j: GameActionType.LogScrollDown,
  k: GameActionType.LogScrollUp,
  down: GameActionType.LogScrollDown,
  up: GameActionType.LogScrollUp,
  escape: GameActionType.LogExit,
  q: GameActionType.LogExit,
};

export function resolveKey(key: KeyPress, mode: InputMode): GameActionType | null {
  // Ctrl+C always quits
  if (key.ctrl && key.name === 'c') {
    return GameActionType.Quit;
  }

  // ? toggles help in any mode except Help (where it exits)
  if (key.sequence === '?') {
    if (mode === InputMode.Help) return GameActionType.HelpExit;
    return GameActionType.ToggleHelp;
  }

  if (mode === InputMode.Help) {
    return helpMap[key.name] || helpMap[key.sequence] || null;
  }

  if (mode === InputMode.Normal) {
    // : enters command mode
    if (key.sequence === ':') {
      return GameActionType.EnterCommand;
    }
    // Check uppercase sequence first (G)
    if (key.sequence && normalMap[key.sequence]) {
      return normalMap[key.sequence];
    }
    return normalMap[key.name] || null;
  }

  if (mode === InputMode.Visual) {
    if (key.sequence === ':') {
      return GameActionType.EnterCommand;
    }
    return visualMap[key.name] || visualMap[key.sequence] || null;
  }

  if (mode === InputMode.Dialog) {
    return dialogMap[key.name] || dialogMap[key.sequence] || null;
  }

  if (mode === InputMode.Log) {
    return logMap[key.name] || logMap[key.sequence] || null;
  }

  return null;
}
