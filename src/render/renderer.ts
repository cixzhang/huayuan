import type { GameState, RenderCell } from '../types.js';
import { InputMode } from '../types.js';
import { FrameBuffer } from './frame.js';
import { renderGroundLayer } from './layers/groundLayer.js';
import { renderStemLayer } from './layers/stemLayer.js';
import { renderFlowerLayer } from './layers/flowerLayer.js';
import { renderBirdLayer } from './layers/birdLayer.js';
import { renderWeatherLayer } from './layers/weatherLayer.js';
import { renderHud, renderHelpOverlay } from './hud.js';
import { renderDialogOverlay } from './dialog.js';
import { renderDialogLog } from './dialogLog.js';
import { inverse, bgRgb, fgRgb } from '../terminal/ansi.js';
import { CELL_WIDTH, HUD_ROWS, NIGHT_DURATION_TICKS, MOON_REFLECTION_RADIUS } from '../constants.js';

export class Renderer {
  private buffer: FrameBuffer;

  constructor(gridRows: number, gridCols: number) {
    this.buffer = new FrameBuffer(gridRows + HUD_ROWS, gridCols);
  }

  render(state: GameState): void {
    this.buffer.clear();

    // Layer 1: Ground
    const ground = renderGroundLayer(state);
    for (let r = 0; r < state.gridRows; r++) {
      for (let c = 0; c < state.gridCols; c++) {
        if (ground[r] && ground[r][c]) {
          this.buffer.set(r, c, ground[r][c]);
        }
      }
    }

    // Layer 2: Stems (overwrites ground where plants exist)
    const stems = renderStemLayer(state);
    for (let r = 0; r < state.gridRows; r++) {
      for (let c = 0; c < state.gridCols; c++) {
        const cell = stems[r]?.[c];
        if (cell) {
          this.buffer.set(r, c, cell);
        }
      }
    }

    // Layer 3: Flowers (overwrites stem layer for mature plants)
    const flowers = renderFlowerLayer(state);
    for (let r = 0; r < state.gridRows; r++) {
      for (let c = 0; c < state.gridCols; c++) {
        const cell = flowers[r]?.[c];
        if (cell) {
          this.buffer.set(r, c, cell);
        }
      }
    }

    // Layer 3.5: Birds
    const birdCells = renderBirdLayer(state);
    for (let r = 0; r < state.gridRows; r++) {
      for (let c = 0; c < state.gridCols; c++) {
        const cell = birdCells[r]?.[c];
        if (cell) {
          this.buffer.set(r, c, cell);
        }
      }
    }

    // Layer 4: Weather effects
    const weatherCells = renderWeatherLayer(state);
    for (let r = 0; r < state.gridRows; r++) {
      for (let c = 0; c < state.gridCols; c++) {
        const cell = weatherCells[r]?.[c];
        if (cell) {
          // Weather overlay: keep ground bg if weather cell has no bg
          if (!cell.bg) {
            const existing = this.buffer.get(r, c);
            if (existing) {
              cell.bg = existing.bg;
            }
          }
          this.buffer.set(r, c, cell);
        }
      }
    }

    // Night tint: apply dim overlay to all game cells when nightPhase > 0
    if (state.weather.nightPhase > 0) {
      const np = state.weather.nightPhase;
      // Night overlay: blend a dark blue bg over the scene
      // We apply a uniform night bg that gets darker with nightPhase
      const nightR = Math.round(30 + 70 * (1 - np));
      const nightG = Math.round(25 + 65 * (1 - np));
      const nightB = Math.round(60 + 60 * (1 - np));
      const nightBg = bgRgb(nightR, nightG, nightB);
      for (let r = 0; r < state.gridRows; r++) {
        for (let c = 0; c < state.gridCols; c++) {
          const existing = this.buffer.get(r, c);
          if (existing) {
            this.buffer.set(r, c, {
              ...existing,
              bg: nightBg,
            });
          }
        }
      }
    }

    // Moon reflection on water at night
    if (state.weather.nightPhase > 0.5) {
      this.renderMoonReflection(state);
    }

    // Visual mode selection highlight
    if (state.mode === InputMode.Visual && state.selection) {
      const sel = state.selection;
      const minR = Math.min(sel.anchor.row, sel.cursor.row);
      const maxR = Math.max(sel.anchor.row, sel.cursor.row);
      const minC = Math.min(sel.anchor.col, sel.cursor.col);
      const maxC = Math.max(sel.anchor.col, sel.cursor.col);

      for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
          const existing = this.buffer.get(r, c);
          if (existing) {
            this.buffer.set(r, c, {
              ...existing,
              style: inverse,
            });
          }
        }
      }
    }

    // Cursor highlight (inverse video)
    const cursorCell = this.buffer.get(state.cursor.row, state.cursor.col);
    if (cursorCell) {
      this.buffer.set(state.cursor.row, state.cursor.col, {
        ...cursorCell,
        style: inverse,
      });
    }

    // Help overlay (replaces game grid if active)
    if (state.showHelp) {
      const helpOverlay = renderHelpOverlay(state, this.buffer.cols, state.gridRows);
      for (let r = 0; r < helpOverlay.length; r++) {
        for (let c = 0; c < helpOverlay[r].length; c++) {
          if (helpOverlay[r][c].char !== ' ' || helpOverlay[r][c].bg !== '') {
            this.buffer.set(r, c, helpOverlay[r][c]);
          }
        }
      }
    }

    // Dialog overlay (replaces game grid if active)
    if (state.dialog.active) {
      const dialogOverlay = renderDialogOverlay(state, this.buffer.cols, state.gridRows);
      for (let r = 0; r < dialogOverlay.length; r++) {
        for (let c = 0; c < dialogOverlay[r].length; c++) {
          if (dialogOverlay[r][c].char !== ' ' || dialogOverlay[r][c].bg !== '') {
            this.buffer.set(r, c, dialogOverlay[r][c]);
          }
        }
      }
    }

    // Dialog log overlay
    if (state.mode === InputMode.Log) {
      const logOverlay = renderDialogLog(state, this.buffer.cols, state.gridRows);
      for (let r = 0; r < logOverlay.length; r++) {
        for (let c = 0; c < logOverlay[r].length; c++) {
          if (logOverlay[r][c].char !== ' ' || logOverlay[r][c].bg !== '') {
            this.buffer.set(r, c, logOverlay[r][c]);
          }
        }
      }
    }

    // HUD
    const hudCells = renderHud(state, this.buffer.cols);
    const hudStartRow = state.gridRows;
    for (let i = 0; i < hudCells.length; i++) {
      for (let c = 0; c < hudCells[i].length && c < this.buffer.cols; c++) {
        this.buffer.set(hudStartRow + i, c, hudCells[i][c]);
      }
    }

    // Flush diff to terminal
    const output = this.buffer.flush();
    if (output.length > 0) {
      process.stdout.write(output);
    }
  }

  private renderMoonReflection(state: GameState): void {
    const tick = state.tickCount;
    const timer = state.weather.dayNightTimer;

    // Moon position drifts across the sky
    const moonCol = Math.floor(state.gridCols * (0.2 + 0.6 * timer / NIGHT_DURATION_TICKS));
    const moonRow = Math.floor(state.gridRows * 0.3);

    for (let r = 0; r < state.gridRows; r++) {
      for (let c = 0; c < state.gridCols; c++) {
        const cell = state.grid[r][c];
        if (!cell.river) continue;
        if (cell.plant) continue;

        // Skip cells with resting birds
        let hasBird = false;
        for (const bird of state.birds) {
          if (bird.state === 'resting' && bird.position.row === r && bird.position.col === c) {
            hasBird = true;
            break;
          }
        }
        if (hasBird) continue;

        const dr = r - moonRow;
        const dc = c - moonCol;
        const dist = Math.sqrt(dr * dr + dc * dc);
        if (dist > MOON_REFLECTION_RADIUS) continue;

        // Intensity falls off with distance + shimmer
        const falloff = 1 - dist / MOON_REFLECTION_RADIUS;
        const shimmer = 0.5 + 0.5 * Math.sin(tick * 0.5 + r * 2 + c * 3);
        const intensity = falloff * shimmer;

        if (intensity < 0.1) continue;

        const existing = this.buffer.get(r, c);
        if (!existing) continue;

        // Blend bg toward silvery (120, 140, 180)
        const blendAmt = intensity * 0.6;
        // Parse existing night bg or use defaults
        const baseR = 30, baseG = 25, baseB = 60;
        const newR = Math.round(baseR + (120 - baseR) * blendAmt);
        const newG = Math.round(baseG + (140 - baseG) * blendAmt);
        const newB = Math.round(baseB + (180 - baseB) * blendAmt);

        const updates: RenderCell = {
          ...existing,
          bg: bgRgb(newR, newG, newB),
        };

        // Brighten fg
        if (intensity > 0.3) {
          const fgBright = Math.round(140 + 115 * intensity);
          updates.fg = fgRgb(fgBright, fgBright, Math.min(255, fgBright + 30));
        }

        // At high intensity, replace char with glint
        if (intensity > 0.7) {
          updates.char = '∘ ';
        }

        this.buffer.set(r, c, updates);
      }
    }
  }

  resize(gridRows: number, gridCols: number): void {
    this.buffer = new FrameBuffer(gridRows + HUD_ROWS, gridCols);
  }
}
