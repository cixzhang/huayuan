import { fg, bg, fgRgb, bgRgb, bold } from '../terminal/ansi.js';

// ============================================================
//  Huayuan Color Palette
//  All colors in one place for easy tuning.
//  RGB values are [r, g, b] tuples.
// ============================================================

type RGB = [number, number, number];

// --- Soil (ground layer) ---
// Each water level has 3 variants for subtle per-cell variation.
// bg = background fill, fg = texture character color (dots, block chars)

export const SOIL = {
  dry: {
    bg: [[175, 150, 120], [170, 145, 115], [180, 155, 125]] as RGB[],
    fg: [[135, 110, 85],  [130, 105, 80],  [140, 115, 90]]  as RGB[],
  },
  damp: {
    bg: [[140, 115, 85], [135, 110, 80], [145, 120, 90]] as RGB[],
    fg: [[105, 82, 60],  [100, 78, 55],  [110, 85, 62]]  as RGB[],
  },
  moist: {
    bg: [[110, 85, 60], [105, 80, 55], [115, 90, 65]] as RGB[],
    fg: [[78, 58, 38],  [74, 55, 35],  [82, 62, 42]]  as RGB[],
  },
  wet: {
    bg: [[82, 62, 42], [78, 58, 38], [86, 65, 45]] as RGB[],
    fg: [[55, 40, 28], [52, 38, 25], [58, 42, 30]] as RGB[],
  },
};

// --- River ---
export const RIVER = {
  bg: [[45, 80, 130], [40, 75, 125], [50, 85, 135]] as RGB[],
  fg: [[80, 130, 185], [75, 125, 180], [85, 135, 190]] as RGB[],
};

// --- Plants (stem & flower layers) ---
// 256-color codes per growth stage: [seed, sprout, growing, mature, flowering]
export const PLANT_COLORS = {
  grass:  [229, 156, 46, 48, 82],
  flower: [229, 156, 46, 213, 201],
  tree:   [229, 156, 46, 49, 85],
};

// --- HUD ---
export const HUD = {
  bg:       bg(236),          // dark gray background
  fg:       fg(252),          // light gray text
  fgDim:    fg(245),          // dimmed hint text
};

// --- Weather ---
export const WEATHER = {
  rain:  [100, 160, 220] as RGB,   // blue drops
  cloud: [160, 160, 170] as RGB,   // gray wisps
  wind:  [180, 180, 190] as RGB,   // light streaks
  night: [20, 20, 50]    as RGB,   // deep blue tint
  sun:   [255, 220, 100] as RGB,   // warm gold
};

// --- Help overlay ---
export const HELP = {
  fg: fg(230),
  bg: bg(235),
};

// --- Helpers (used by layers) ---

export function soilBgForWater(waterLevel: number): string {
  const palette = waterLevel >= 60 ? SOIL.wet
    : waterLevel >= 30 ? SOIL.moist
    : waterLevel > 0 ? SOIL.damp
    : SOIL.dry;
  return bgRgb(...palette.bg[0]);
}

export function soilFgBg(waterLevel: number, variant: number): { fg: string; bg: string } {
  const palette = waterLevel >= 60 ? SOIL.wet
    : waterLevel >= 30 ? SOIL.moist
    : waterLevel > 0 ? SOIL.damp
    : SOIL.dry;
  const v = variant % 3;
  return {
    fg: fgRgb(...palette.fg[v]),
    bg: bgRgb(...palette.bg[v]),
  };
}

export function riverFgBg(variant: number): { fg: string; bg: string } {
  const v = variant % 3;
  return {
    fg: fgRgb(...RIVER.fg[v]),
    bg: bgRgb(...RIVER.bg[v]),
  };
}

export function plantFg(speciesId: string, stage: number): string {
  const colors = PLANT_COLORS[speciesId as keyof typeof PLANT_COLORS];
  if (!colors) return fg(255);
  return fg(colors[stage] ?? 255);
}

export const PLANT_STYLE = bold;

/** Blend an RGB color toward the night tint based on nightPhase (0.0-1.0). */
export function nightTint(rgb: RGB, nightPhase: number): RGB {
  const t = Math.max(0, Math.min(1, nightPhase)) * 0.6; // max 60% blend toward night
  return [
    Math.round(rgb[0] * (1 - t) + WEATHER.night[0] * t),
    Math.round(rgb[1] * (1 - t) + WEATHER.night[1] * t),
    Math.round(rgb[2] * (1 - t) + WEATHER.night[2] * t),
  ];
}
