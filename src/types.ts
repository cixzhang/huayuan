// === Input Modes ===
export enum InputMode {
  Normal = 'normal',
  Visual = 'visual',
  Command = 'command',
  Dialog = 'dialog',
  Log = 'log',
  Help = 'help',
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
  Talk = 'talk',
  DialogAdvance = 'dialogAdvance',
  DialogSelect1 = 'dialogSelect1',
  DialogSelect2 = 'dialogSelect2',
  DialogSelect3 = 'dialogSelect3',
  DialogExit = 'dialogExit',
  Yank = 'yank',
  Paste = 'paste',
  DeletePlants = 'deletePlants',
  DeletePlantAtCursor = 'deletePlantAtCursor',
  FindChar = 'findChar',
  JumpBottom = 'jumpBottom',
  JumpTop = 'jumpTop',
  OpenLog = 'openLog',
  LogScrollUp = 'logScrollUp',
  LogScrollDown = 'logScrollDown',
  LogExit = 'logExit',
  HelpScrollUp = 'helpScrollUp',
  HelpScrollDown = 'helpScrollDown',
  HelpExit = 'helpExit',
  DialogScrollUp = 'dialogScrollUp',
  DialogScrollDown = 'dialogScrollDown',
  ExecuteCommand = 'executeCommand',
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
  hybridLevel: number;              // 0=base, 1-4=hybrid, -1=special
  colorVariants: number[][];        // array of [seed,sprout,growing,mature,flowering] 256-color code arrays
  parentSpecies?: [string, string]; // what species combine to create this
  special?: 'lotus' | 'cactus' | 'moss' | 'maple';
}

export interface Plant {
  speciesId: string;
  stage: PlantStage;
  waterLevel: number;
  growthProgress: number;     // Ticks accumulated toward next stage
  age: number;                // Total ticks alive
  colorVariant: number;       // index into species color variant palette (0 = default)
}

// === Grid Cell ===
export interface Cell {
  waterLevel: number;         // 0-100
  plant: Plant | null;
  river: boolean;             // true if this cell is part of the river
  wildChar: string | null;    // decorative wild plant char, harvestable
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
  Neutral = 'neutral',
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

// === Birds ===
export enum BirdType { Robin = 0, Sparrow = 1, Duck = 2, Goose = 3 }

export interface Bird {
  id: number;
  type: BirdType;
  position: Position;
  state: 'flying' | 'resting' | 'leaving';
  direction: 'left' | 'right';
  restTimer: number;
  animFrame: number;
  targetPosition: Position | null;
  dialogId: string | null;
}

export type SeedRewardType =
  | 'random_base' | 'random_hybrid'
  | 'grass' | 'flower' | 'tree'
  | 'lotus' | 'cactus' | 'moss'
  | 'cha' | 'zhu' | 'maple'
  | 'fang' | 'miao' | 'guo' | 'tao' | 'ju' | 'mei' | 'lan';

export interface DialogOption {
  text: string;
  pinyin: string;
  english: string;
  isCorrect: boolean;
}

export interface DialogTree {
  id: string;
  conditions?: {
    weather?: WeatherType;
    isNight?: boolean;
    minPlants?: number;
    maxPlants?: number;
  };
  lines: { text: string; pinyin: string }[];
  question: { text: string; pinyin: string };
  options: DialogOption[];
  followup: { text: string; pinyin: string };
  seedReward: SeedRewardType;
}

export interface DialogState {
  active: boolean;
  birdId: number;
  treeId: string;
  phase: 'speech' | 'question' | 'result';
  lineIndex: number;
  selectedOption: number;
  answeredCorrectly: boolean | null;
  seedAwarded: string | null;
  pinyinScroll: number;
}

// === Clipboard (for yank/paste) ===
export interface Clipboard {
  cells: (Plant | null)[][];
  width: number;
  height: number;
}

// === Dialog Log ===
export interface DialogLogEntry {
  birdType: BirdType;
  treeId: string;
  answeredCorrectly: boolean;
  tick: number;
  lines: { text: string; pinyin: string }[];
  question: { text: string; pinyin: string };
  options: DialogOption[];
  followup: { text: string; pinyin: string };
  seedReward: string | null;
}

// === Settings ===
export interface GameSettings {
  soundEnabled: boolean;
  weatherEffectsEnabled: boolean;
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
  birds: Bird[];
  nextBirdId: number;
  dialog: DialogState;
  clipboard: Clipboard | null;
  dialogLog: DialogLogEntry[];
  logScroll: number;
  helpScroll: number;
}
