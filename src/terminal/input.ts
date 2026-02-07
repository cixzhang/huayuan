import * as readline from 'readline';

export interface KeyPress {
  name: string;
  sequence: string;
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
}

export type KeyHandler = (key: KeyPress) => void;

let handler: KeyHandler | null = null;

export function startInput(onKey: KeyHandler): void {
  handler = onKey;

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }
  process.stdin.resume();

  readline.emitKeypressEvents(process.stdin);

  process.stdin.on('keypress', (_str: string | undefined, key: readline.Key | undefined) => {
    if (!key || !handler) return;

    handler({
      name: key.name || '',
      sequence: key.sequence || '',
      ctrl: key.ctrl || false,
      meta: key.meta || false,
      shift: key.shift || false,
    });
  });
}

export function stopInput(): void {
  handler = null;
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }
  process.stdin.pause();
}
