import { InputMode, GameActionType, type GameAction } from '../types.js';
import { resolveKey } from './keymap.js';
import type { KeyPress } from '../terminal/input.js';

export class InputManager {
  mode: InputMode = InputMode.Normal;
  private commandBuffer = '';
  private actionQueue: GameAction[] = [];

  handleKey(key: KeyPress): void {
    if (this.mode === InputMode.Command) {
      this.handleCommandKey(key);
      return;
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
    switch (cmd) {
      case 'q':
      case 'quit':
        this.pushAction({ type: GameActionType.Quit });
        break;
      default:
        // Unknown command — ignore for now
        break;
    }
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
