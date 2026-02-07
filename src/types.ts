// === Input Modes ===
export enum InputMode {
  Normal = 'normal',
  Visual = 'visual',
  Command = 'command',
}

// === Game Actions ===
export enum GameActionType {
  MoveUp = 'moveUp',
  MoveDown = 'moveDown',
  MoveLeft = 'moveLeft',
  MoveRight = 'moveRight',
  JumpRight = 'jumpRight',
  JumpLeft = 'jumpLeft',
  UseTool = 'useTool',
  UseToolOnSelection = 'useToolOnSelection',
  CycleTool = 'cycleTool',
  CycleSeed = 'cycleSeed',
  SelectTool1 = 'selectTool1',
  SelectTool2 = 'selectTool2',
  SelectTool3 = 'selectTool3',
  EnterVisual = 'enterVisual',
  ExitVisual = 'exitVisual',
  EnterCommand = 'enterCommand',
  ExitCommand = 'exitCommand',
  UpdateCommand = 'updateCommand',
  ToggleHelp = 'toggleHelp',
  Quit = 'quit',
}

export interface GameAction {
  type: GameActionType;
  payload?: unknown;
}

// === Tools ===
export enum ToolType {
  Plant = 'plant',
  Water = 'water',
  Harvest = 'harvest',
}

// === Plant System ===
export enum PlantStage {
  Seed = 0,
  Sprout = 1,
  Growing = 2,
  Mature = 3,
  Flowering = 4,
}

export interface PlantSpecies {
  id: string;
  name: string;
  stages: string[];           // Display characters per stage
  growthTicks: number[];      // Ticks needed per stage transition
  waterNeed: number;          // Water consumed per growth tick
  hanzi: string;
  pinyin: string;
  english: string;
}

export interface Plant {
  speciesId: string;
  stage: PlantStage;
  waterLevel: number;
  growthProgress: number;     // Ticks accumulated toward next stage
  age: number;                // Total ticks alive
}

// === Grid Cell ===
export interface Cell {
  waterLevel: number;         // 0-100
  plant: Plant | null;
  river: boolean;             // true if this cell is part of the river
}

// === Cursor & Selection ===
export interface Position {
  row: number;
  col: number;
}

export interface Selection {
  anchor: Position;
  cursor: Position;
}

// === Weather ===
export enum WeatherType {
  Clear = 'clear',
  Cloudy = 'cloudy',
  Rain = 'rain',
  Wind = 'wind',
}

export interface WeatherState {
  current: WeatherType;
  intensity: number;        // 0.0-1.0, ramps up/down during transitions
  ticksInState: number;     // how long current weather has lasted
  stateDuration: number;    // total ticks this state will last
  isNight: boolean;         // orthogonal to weather type
  nightPhase: number;       // 0.0-1.0 for dusk→night→dawn cycle
  dayNightTimer: number;    // ticks into current day/night period
}

// === Inventory ===
export interface Inventory {
  seeds: Record<string, number>;  // speciesId -> count
}

// === Render Cell ===
export interface RenderCell {
  char: string;               // 1 or 2 chars (full-width)
  fg: string;                 // ANSI fg escape
  bg: string;                 // ANSI bg escape
  style: string;              // Additional ANSI styles
}

// === Game State ===
export interface GameState {
  grid: Cell[][];
  gridRows: number;
  gridCols: number;
  cursor: Position;
  selection: Selection | null;
  mode: InputMode;
  tool: ToolType;
  selectedSeed: string;
  inventory: Inventory;
  showHelp: boolean;
  commandBuffer: string;
  tickCount: number;
  message: string;
  messageExpiry: number;
  weather: WeatherState;
}
