import type { GameState, RenderCell } from '../types.js';
import { InputMode, ToolType, PlantStage, WeatherType } from '../types.js';
import { fg, bg } from '../terminal/ansi.js';
import { getSpecies } from '../data/plants.js';
import { lookupChar } from '../data/chinese.js';
import { HUD, HELP } from './palette.js';

function padOrTruncate(str: string, len: number): string {
  if (str.length >= len) return str.slice(0, len);
  return str + ' '.repeat(len - str.length);
}

function textToRenderCells(text: string, fgColor: string, bgColor: string, width: number): RenderCell[] {
  const cells: RenderCell[] = [];
  const padded = padOrTruncate(text, width);
  // Each cell takes 2 terminal columns; we store 1 char per cell (ASCII gets padded in frame flush)
  for (let i = 0; i < width; i++) {
    cells.push({
      char: padded[i] || ' ',
      fg: fgColor,
      bg: bgColor,
      style: '',
    });
  }
  return cells;
}

function toolName(tool: ToolType): string {
  switch (tool) {
    case ToolType.Plant: return '1:Plant';
    case ToolType.Water: return '2:Water';
    case ToolType.Harvest: return '3:Harvest';
  }
}

function weatherDisplay(state: GameState): string {
  const w = state.weather;
  let icon: string;
  let hanzi: string;
  let name: string;
  switch (w.current) {
    case WeatherType.Clear:  icon = '☀'; hanzi = '晴'; name = 'Sun';   break;
    case WeatherType.Cloudy: icon = '☁'; hanzi = '云'; name = 'Cloud'; break;
    case WeatherType.Rain:   icon = '🌧'; hanzi = '雨'; name = 'Rain'; break;
    case WeatherType.Wind:   icon = '💨'; hanzi = '风'; name = 'Wind'; break;
  }
  // Intensity dots: 3 levels
  const filled = Math.ceil(w.intensity * 3);
  const dots = '●'.repeat(filled) + '○'.repeat(3 - filled);
  let result = `${hanzi} ${name} ${dots}`;
  if (w.isNight || w.nightPhase > 0.1) {
    result += ' 🌙';
  }
  return result;
}

function modeName(mode: InputMode): string {
  switch (mode) {
    case InputMode.Normal: return 'NORMAL';
    case InputMode.Visual: return 'VISUAL';
    case InputMode.Command: return 'COMMAND';
  }
}

export function renderHud(state: GameState, cols: number): RenderCell[][] {
  const rows: RenderCell[][] = [];
  const hudBg = HUD.bg;
  const hudFg = HUD.fg;

  // Row 1: Mode | Tool | Seed | Inventory summary
  const modeStr = modeName(state.mode);
  const toolStr = toolName(state.tool);
  const seedSpecies = getSpecies(state.selectedSeed);
  const seedStr = seedSpecies ? `Seed:${seedSpecies.hanzi}(${seedSpecies.name})` : 'Seed:?';
  const invParts: string[] = [];
  for (const [id, count] of Object.entries(state.inventory.seeds)) {
    const sp = getSpecies(id);
    if (sp && count > 0) {
      invParts.push(`${sp.hanzi}x${count}`);
    }
  }
  const invStr = invParts.join(' ');

  const weatherStr = weatherDisplay(state);
  let line1 = ` [${modeStr}] ${toolStr} | ${weatherStr} | ${seedStr} | ${invStr}`;
  if (state.message) {
    line1 += `  -- ${state.message}`;
  }
  rows.push(textToRenderCells(line1, hudFg, hudBg, cols));

  // Row 2: Plant info at cursor / command buffer
  let line2 = '';
  if (state.mode === InputMode.Command) {
    line2 = ` :${state.commandBuffer}█`;
  } else {
    const cell = state.grid[state.cursor.row]?.[state.cursor.col];
    if (cell?.plant) {
      const species = getSpecies(cell.plant.speciesId);
      if (species) {
        const stageName = PlantStage[cell.plant.stage];
        const vocab = lookupChar(species.stages[cell.plant.stage]);
        let vocabStr = '';
        if (vocab) {
          vocabStr = ` | ${vocab.hanzi} (${vocab.pinyin}) = ${vocab.english}`;
        }
        line2 = ` ${species.hanzi} ${species.name} [${stageName}] water:${cell.waterLevel}% growth:${cell.plant.growthProgress}/${species.growthTicks[cell.plant.stage] || '✓'}${vocabStr}`;
      }
    } else {
      const cell2 = state.grid[state.cursor.row]?.[state.cursor.col];
      if (cell2) {
        line2 = ` Soil water:${cell2.waterLevel}% | pos:(${state.cursor.row},${state.cursor.col})`;
        // Show weather vocab when weather is active
        const w = state.weather;
        let weatherHanzi = '';
        if (w.current === WeatherType.Rain && w.intensity > 0) weatherHanzi = '雨';
        else if (w.current === WeatherType.Wind && w.intensity > 0) weatherHanzi = '风';
        else if (w.current === WeatherType.Cloudy && w.intensity > 0) weatherHanzi = '云';
        else if (w.current === WeatherType.Clear && w.intensity > 0) weatherHanzi = '晴';
        if (w.isNight) weatherHanzi = '夜';
        if (weatherHanzi) {
          const vocab = lookupChar(weatherHanzi);
          if (vocab) {
            line2 += ` | ${vocab.hanzi} (${vocab.pinyin}) = ${vocab.english}`;
          }
        }
      }
    }
  }
  rows.push(textToRenderCells(line2, hudFg, hudBg, cols));

  // Row 3: Help hint
  const line3 = ' hjkl:move  space:use tool  tab:cycle tool  s:cycle seed  ?:help  :q quit';
  rows.push(textToRenderCells(line3, HUD.fgDim, hudBg, cols));

  return rows;
}

export function renderHelpOverlay(_state: GameState, cols: number, gridRows: number): RenderCell[][] {
  const lines = [
    '╔══════════════════════════════════════╗',
    '║         花 园  Huāyuán  Help           ║',
    '║                                      ║',
    '║  Movement:                           ║',
    '║    h/j/k/l  Move cursor              ║',
    '║    w/b      Jump 5 cells             ║',
    '║                                      ║',
    '║  Tools:                              ║',
    '║    1        Plant tool               ║',
    '║    2        Water tool               ║',
    '║    3        Harvest tool             ║',
    '║    tab      Cycle tools              ║',
    '║    space    Use current tool         ║',
    '║    s        Cycle seed type          ║',
    '║                                      ║',
    '║  Modes:                              ║',
    '║    v        Visual select mode       ║',
    '║    :q       Quit                     ║',
    '║    ?        Toggle this help         ║',
    '║    Esc      Return to normal         ║',
    '║                                      ║',
    '║  Grow plants: plant → water → wait   ║',
    '╚══════════════════════════════════════╝',
  ];

  const overlay: RenderCell[][] = [];
  const startRow = Math.max(0, Math.floor((gridRows - lines.length) / 2));
  const boxWidth = 40; // chars in the box
  const startCol = Math.max(0, Math.floor((cols - boxWidth / 2) / 2));

  for (let r = 0; r < gridRows; r++) {
    const row: RenderCell[] = [];
    const lineIdx = r - startRow;
    const line = lineIdx >= 0 && lineIdx < lines.length ? lines[lineIdx] : null;

    for (let c = 0; c < cols; c++) {
      if (line) {
        const charIdx = c - startCol;
        // Each line char maps to one cell (will be 2 terminal cols)
        // But box chars are single-width, so we need to handle this carefully
        if (charIdx >= 0 && charIdx < line.length) {
          row.push({
            char: line[charIdx],
            fg: HELP.fg,
            bg: HELP.bg,
            style: '',
          });
        } else {
          row.push({ char: ' ', fg: '', bg: '', style: '' });
        }
      } else {
        row.push({ char: ' ', fg: '', bg: '', style: '' });
      }
    }
    overlay.push(row);
  }

  return overlay;
}
