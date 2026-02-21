import { InputMode, GameActionType, type GameAction } from '../types.js';
import { resolveKey } from './keymap.js';
import type { KeyPress } from '../terminal/input.js';

export class InputManager {
  mode: InputMode = InputMode.Normal;
  private commandBuffer = '';
  private actionQueue: GameAction[] = [];
  pendingKey: string | null = null;

  handleKey(key: KeyPress): void {
    if (this.mode === InputMode.Command) {
      this.handleCommandKey(key);
      return;
    }

    if (this.mode === InputMode.Dialog) {
      const actionType = resolveKey(key, this.mode);
      if (actionType !== null) {
        if (actionType === GameActionType.DialogExit) {
          this.mode = InputMode.Normal;
        }
        this.pushAction({ type: actionType });
      }
      return;
    }

    if (this.mode === InputMode.Help) {
      const actionType = resolveKey(key, this.mode);
      if (actionType !== null) {
        if (actionType === GameActionType.HelpExit) {
          this.mode = InputMode.Normal;
        }
        this.pushAction({ type: actionType });
      }
      return;
    }

    if (this.mode === InputMode.Log) {
      const actionType = resolveKey(key, this.mode);
      if (actionType !== null) {
        if (actionType === GameActionType.LogExit) {
          this.mode = InputMode.Normal;
        }
        this.pushAction({ type: actionType });
      }
      return;
    }

    // Handle pending multi-key sequences (f, g) in normal mode
    if (this.mode === InputMode.Normal && this.pendingKey !== null) {
      const pending = this.pendingKey;
      this.pendingKey = null;
      if (pending === 'f' && key.sequence && key.sequence.length === 1) {
        this.pushAction({ type: GameActionType.FindChar, payload: key.sequence });
        return;
      }
      if (pending === 'g' && key.sequence === 'g') {
        this.pushAction({ type: GameActionType.JumpTop });
        return;
      }
      // Invalid second key — drop the sequence
      return;
    }

    // Check for pending key triggers in normal mode
    if (this.mode === InputMode.Normal) {
      if (key.sequence === 'f') {
        this.pendingKey = 'f';
        return;
      }
      if (key.sequence === 'g') {
        this.pendingKey = 'g';
        return;
      }
    }

    const actionType = resolveKey(key, this.mode);
    if (actionType === null) return;

    if (actionType === GameActionType.EnterCommand) {
      this.mode = InputMode.Command;
      this.commandBuffer = '';
      this.pushAction({ type: GameActionType.EnterCommand });
      return;
    }

    if (actionType === GameActionType.EnterVisual) {
      this.mode = InputMode.Visual;
      this.pushAction({ type: GameActionType.EnterVisual });
      return;
    }

    if (actionType === GameActionType.ExitVisual) {
      this.mode = InputMode.Normal;
      this.pushAction({ type: GameActionType.ExitVisual });
      return;
    }

    if (actionType === GameActionType.UseToolOnSelection) {
      this.mode = InputMode.Normal;
      this.pushAction({ type: actionType });
      return;
    }

    // Yank and DeletePlants exit visual mode
    if (actionType === GameActionType.Yank || actionType === GameActionType.DeletePlants) {
      this.mode = InputMode.Normal;
      this.pushAction({ type: actionType });
      return;
    }

    this.pushAction({ type: actionType });
  }

  private handleCommandKey(key: KeyPress): void {
    if (key.name === 'escape') {
      this.mode = InputMode.Normal;
      this.commandBuffer = '';
      this.pushAction({ type: GameActionType.ExitCommand });
      return;
    }

    if (key.name === 'return') {
      this.executeCommand(this.commandBuffer.trim());
      this.mode = InputMode.Normal;
      this.commandBuffer = '';
      this.pushAction({ type: GameActionType.ExitCommand });
      return;
    }

    if (key.name === 'backspace') {
      this.commandBuffer = this.commandBuffer.slice(0, -1);
      if (this.commandBuffer.length === 0) {
        this.mode = InputMode.Normal;
        this.pushAction({ type: GameActionType.ExitCommand });
      } else {
        this.pushAction({ type: GameActionType.UpdateCommand, payload: this.commandBuffer });
      }
      return;
    }

    // Append printable characters
    if (key.sequence && key.sequence.length === 1 && !key.ctrl && !key.meta) {
      this.commandBuffer += key.sequence;
      this.pushAction({ type: GameActionType.UpdateCommand, payload: this.commandBuffer });
    }
  }

  private executeCommand(cmd: string): void {
    if (cmd === 'q' || cmd === 'quit') {
      this.pushAction({ type: GameActionType.Quit });
      return;
    }

    if (cmd === 'w') {
      this.pushAction({ type: GameActionType.ExecuteCommand, payload: { command: 'save' } });
      return;
    }

    if (cmd === 'log') {
      this.mode = InputMode.Log;
      this.pushAction({ type: GameActionType.OpenLog });
      return;
    }

    // Parse multi-word commands
    const parts = cmd.split(/\s+/);
    const verb = parts[0];

    if (verb === 'terraform') {
      this.pushAction({ type: GameActionType.ExecuteCommand, payload: { command: 'terraform', arg: parts[1] || '' } });
      return;
    }

    if (verb === 'tool' || verb === 't') {
      const arg = parts[1];
      if (arg) {
        this.pushAction({ type: GameActionType.ExecuteCommand, payload: { command: 'tool', arg } });
      }
      return;
    }

    if (verb === 'seed') {
      const arg = parts[1];
      if (arg) {
        this.pushAction({ type: GameActionType.ExecuteCommand, payload: { command: 'seed', arg } });
      }
      return;
    }

    if (verb === 'summon') {
      const arg = parts[1];
      if (arg) {
        this.pushAction({ type: GameActionType.ExecuteCommand, payload: { command: 'summon', arg } });
      }
      return;
    }

    if (verb === 'weather') {
      const arg = parts[1];
      if (arg) {
        this.pushAction({ type: GameActionType.ExecuteCommand, payload: { command: 'weather', arg } });
      }
      return;
    }

    if (verb === 'play') {
      const arg = parts[1];
      if (arg) {
        this.pushAction({ type: GameActionType.ExecuteCommand, payload: { command: 'play', arg } });
      }
      return;
    }

    if (verb === 'expand') {
      const dir = parts[1];
      const amount = parseInt(parts[2] || '1', 10);
      if (dir) {
        this.pushAction({ type: GameActionType.ExecuteCommand, payload: { command: 'expand', dir, amount } });
      }
      return;
    }

    // Unknown command — ignore
  }

  private pushAction(action: GameAction): void {
    this.actionQueue.push(action);
  }

  drainActions(): GameAction[] {
    const actions = this.actionQueue;
    this.actionQueue = [];
    return actions;
  }

  getCommandBuffer(): string {
    return this.commandBuffer;
  }
}
