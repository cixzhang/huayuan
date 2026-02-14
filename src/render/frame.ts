import type { RenderCell } from '../types.js';
import { moveTo, reset } from '../terminal/ansi.js';
import { CELL_WIDTH } from '../constants.js';

// CJK characters are full-width (2 terminal columns). ASCII/Latin/symbols are half-width.
function isFullWidth(char: string): boolean {
  const code = char.charCodeAt(0);
  return (
    (code >= 0x3400 && code <= 0x4DBF) ||   // CJK Extension A
    (code >= 0x4E00 && code <= 0x9FFF) ||   // CJK Unified Ideographs
    (code >= 0xF900 && code <= 0xFAFF) ||   // CJK Compatibility Ideographs
    (code >= 0x3000 && code <= 0x303F) ||   // CJK Symbols and Punctuation
    (code >= 0x3040 && code <= 0x30FF) ||   // Hiragana + Katakana
    (code >= 0xFF01 && code <= 0xFF60)      // Fullwidth Forms
  );
}

export class FrameBuffer {
  private current: RenderCell[][];
  private previous: RenderCell[][];
  readonly rows: number;
  readonly cols: number;
  rowOffset = 0;
  colOffset = 0;

  constructor(rows: number, cols: number) {
    this.rows = rows;
    this.cols = cols;
    this.current = this.makeEmpty();
    this.previous = this.makeEmpty();
  }

  private makeEmpty(): RenderCell[][] {
    return Array.from({ length: this.rows }, () =>
      Array.from({ length: this.cols }, () => ({
        char: ' ',
        fg: '',
        bg: '',
        style: '',
      }))
    );
  }

  set(row: number, col: number, cell: RenderCell): void {
    if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
      this.current[row][col] = cell;
    }
  }

  get(row: number, col: number): RenderCell | null {
    if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
      return this.current[row][col];
    }
    return null;
  }

  clear(): void {
    this.current = this.makeEmpty();
  }

  flush(): string {
    let out = '';
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const curr = this.current[r][c];
        const prev = this.previous[r][c];

        if (
          curr.char !== prev.char ||
          curr.fg !== prev.fg ||
          curr.bg !== prev.bg ||
          curr.style !== prev.style
        ) {
          // Position: each game cell is CELL_WIDTH terminal columns
          out += moveTo(r + this.rowOffset, c * CELL_WIDTH + this.colOffset);
          out += curr.style + curr.fg + curr.bg;

          // Full-width chars (CJK) already occupy 2 columns; pad others with a space
          if (isFullWidth(curr.char)) {
            out += curr.char;
          } else {
            out += curr.char + ' ';
          }
          out += reset;
        }
      }
    }

    // Swap buffers
    this.previous = this.current;
    this.current = this.makeEmpty();

    return out;
  }

  resize(rows: number, cols: number): FrameBuffer {
    return new FrameBuffer(rows, cols);
  }
}
