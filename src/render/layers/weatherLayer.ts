import type { GameState, RenderCell } from '../../types.js';
import { WeatherType } from '../../types.js';
import { fgRgb } from '../../terminal/ansi.js';
import { WEATHER } from '../palette.js';

// Deterministic hash for per-cell variation / animation
function cellHash(row: number, col: number, seed: number): number {
  return ((row * 2654435761 + seed) ^ (col * 2246822519)) >>> 0;
}

export function renderWeatherLayer(state: GameState): (RenderCell | null)[][] {
  const { gridRows, gridCols, tickCount, weather } = state;
  const layer: (RenderCell | null)[][] = [];

  for (let r = 0; r < gridRows; r++) {
    layer.push(new Array(gridCols).fill(null));
  }

  if (weather.intensity <= 0 && weather.nightPhase <= 0) return layer;

  switch (weather.current) {
    case WeatherType.Clear:
      renderSunSparkles(layer, gridRows, gridCols, tickCount, weather.intensity);
      break;
    case WeatherType.Cloudy:
      renderClouds(layer, gridRows, gridCols, tickCount, weather.intensity);
      break;
    case WeatherType.Rain:
      renderRain(layer, gridRows, gridCols, tickCount, weather.intensity);
      break;
    case WeatherType.Wind:
      renderWind(layer, gridRows, gridCols, tickCount, weather.intensity);
      break;
  }

  // Night stars (independent of weather type)
  if (weather.nightPhase > 0.3) {
    renderStars(layer, gridRows, gridCols, tickCount, weather.nightPhase);
  }

  return layer;
}

function renderSunSparkles(
  layer: (RenderCell | null)[][],
  rows: number, cols: number,
  tick: number, intensity: number
): void {
  const sparkleChars = ['✦', '·', '✦'];
  const fg = fgRgb(...WEATHER.sun);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const h = cellHash(r, c, tick);
      // ~2% of cells sparkle, shifting each tick
      if (h % 50 < Math.ceil(intensity)) {
        layer[r][c] = {
          char: sparkleChars[h % sparkleChars.length],
          fg,
          bg: '',
          style: '',
        };
      }
    }
  }
}

function renderClouds(
  layer: (RenderCell | null)[][],
  rows: number, cols: number,
  tick: number, intensity: number
): void {
  const cloudChars = ['░', '▒', '░', '·'];
  const fg = fgRgb(...WEATHER.cloud);
  // Clouds drift across the whole map (top-down view — clouds are overhead)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Drift offset: clouds move right over time
      const driftC = (c + Math.floor(tick * 0.5) + r * 3) % cols;
      const h = cellHash(r, driftC, 42);
      // Density ~20% at full intensity
      if (h % 100 < 20 * intensity) {
        layer[r][c] = {
          char: cloudChars[h % cloudChars.length],
          fg,
          bg: '',
          style: '',
        };
      }
    }
  }
}

function renderRain(
  layer: (RenderCell | null)[][],
  rows: number, cols: number,
  tick: number, intensity: number
): void {
  const dropChars = ['│', ',', "'", '│', ','];
  const fg = fgRgb(...WEATHER.rain);
  // Rain density: 15-30% based on intensity
  const densityThreshold = Math.floor(15 + 15 * intensity);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Animate drops falling: shift row position each tick
      const animR = (r + tick * 2) % rows;
      const h = cellHash(animR, c, 77);
      if (h % 100 < densityThreshold) {
        layer[r][c] = {
          char: dropChars[h % dropChars.length],
          fg,
          bg: '',
          style: '',
        };
      }
    }
  }
}

function renderWind(
  layer: (RenderCell | null)[][],
  rows: number, cols: number,
  tick: number, intensity: number
): void {
  const windChars = ['─', '~', '─', '~'];
  const fg = fgRgb(...WEATHER.wind);
  // Wind streaks across middle rows
  const startRow = Math.floor(rows * 0.2);
  const endRow = Math.floor(rows * 0.8);

  for (let r = startRow; r < endRow; r++) {
    for (let c = 0; c < cols; c++) {
      // Streaks move right quickly
      const driftC = (c + tick * 3 + r * 7) % cols;
      const h = cellHash(r, driftC, 99);
      // ~8% density at full intensity
      if (h % 100 < Math.floor(8 * intensity)) {
        layer[r][c] = {
          char: windChars[h % windChars.length],
          fg,
          bg: '',
          style: '',
        };
      }
    }
  }
}

function renderStars(
  layer: (RenderCell | null)[][],
  rows: number, cols: number,
  tick: number, nightPhase: number
): void {
  const starChars = ['·', '✦', '·', '·'];
  const fg = fgRgb(200, 200, 230);
  // Stars in top 40% of rows, only where no other weather effect
  const starRows = Math.max(2, Math.floor(rows * 0.4));

  for (let r = 0; r < starRows; r++) {
    for (let c = 0; c < cols; c++) {
      if (layer[r][c] !== null) continue; // don't overwrite rain/clouds
      const h = cellHash(r, c, 123);
      // Twinkle: some stars blink based on tick
      const twinkle = (h + tick) % 7 === 0;
      // ~3% density, modulated by nightPhase
      if (h % 100 < Math.floor(3 * nightPhase) && twinkle) {
        layer[r][c] = {
          char: starChars[h % starChars.length],
          fg,
          bg: '',
          style: '',
        };
      }
    }
  }
}
