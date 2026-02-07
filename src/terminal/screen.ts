import { enterAltBuffer, exitAltBuffer, clearScreen, hideCursor, showCursor, moveTo } from './ansi.js';

export interface TerminalSize {
  rows: number;
  cols: number;
}

export function getTerminalSize(): TerminalSize {
  return {
    rows: process.stdout.rows || 24,
    cols: process.stdout.columns || 80,
  };
}

export function enterFullScreen(): void {
  process.stdout.write(enterAltBuffer + hideCursor + clearScreen + moveTo(0, 0));
}

export function exitFullScreen(): void {
  process.stdout.write(showCursor + exitAltBuffer);
}

export function onResize(callback: (size: TerminalSize) => void): void {
  process.stdout.on('resize', () => {
    callback(getTerminalSize());
  });
}
