// Timing
export const RENDER_FPS = 20;
export const RENDER_INTERVAL_MS = 1000 / RENDER_FPS;        // 50ms
export const GROWTH_TICK_MS = 3000;                           // 3 seconds

// Grid
export const CELL_WIDTH = 2;        // Each game cell = 2 terminal columns
export const HUD_ROWS = 3;          // Rows reserved for HUD at bottom
export const MIN_GRID_ROWS = 5;
export const MIN_GRID_COLS = 10;

// Movement
export const JUMP_DISTANCE = 5;

// Water
export const WATER_AMOUNT = 30;       // Water added per tool use
export const WATER_MAX = 100;
export const WATER_DECAY_PER_TICK = 2; // Water lost per growth tick
export const WATER_THRESHOLD = 10;     // Minimum water for growth

// Inventory
export const STARTING_SEEDS: Record<string, number> = {
  grass: 10,
  flower: 5,
  tree: 3,
};

// River
export const RIVER_WATER_RADIUS = 2;       // Tiles around river that get watered
export const RIVER_WATER_AMOUNT = 8;       // Water added per tick to nearby tiles

// Weather
export const WEATHER_MIN_DURATION = 8;        // min growth ticks per state
export const WEATHER_MAX_DURATION = 15;       // max growth ticks per state
export const WEATHER_TRANSITION_TICKS = 3;    // ticks to ramp intensity up/down
export const RAIN_WATER_PER_TICK = 5;         // water added to ALL cells when raining
export const NIGHT_GROWTH_PENALTY = 0.5;      // growth ticks count half at night
export const DAY_DURATION_TICKS = 40;         // ~2 min of day
export const NIGHT_DURATION_TICKS = 20;       // ~1 min of night

// Propagation
export const PROPAGATION_CHANCE = 0.05;           // 5% per tick per eligible plant
export const PROPAGATION_MIN_AGE = 5;             // must be flowering for 5+ ticks
export const PROPAGATION_WATER_THRESHOLD = 20;    // parent cell needs 20+ water
export const PROPAGATION_OFFSPRING_WATER = 15;    // water gifted to offspring cell
export const WATER_DONATION_AMOUNT = 3;           // water donated per tick per neighbor
export const WATER_DONATION_THRESHOLD = 40;       // cell needs 40+ water to donate

// Messages
export const MESSAGE_DURATION_TICKS = 10;
