import type { GameState, RenderCell } from '../types.js';
import { InputMode, ToolType, PlantStage, WeatherType } from '../types.js';
import { fg, bg } from '../terminal/ansi.js';
import { getSpecies } from '../data/plants.js';
import { HUD, HELP, TOOL_COLORS, BIRD_COLORS } from './palette.js';
import { getBirdAtPosition } from '../game/birds.js';
import { getBirdTypeDef } from '../data/birds.js';
import { getDialogById } from '../data/birds.js';
import { plantFg } from './palette.js';

// --- Segment-based row builder ---

interface Segment {
  text: string;
  fg: string;
  bg: string;
}

function renderColoredRow(segments: Segment[], width: number, defaultBg: string): RenderCell[] {
  const cells: RenderCell[] = [];
  for (const seg of segments) {
    for (const ch of seg.text) {
      if (cells.length >= width) break;
      cells.push({ char: ch, fg: seg.fg, bg: seg.bg || defaultBg, style: '' });
    }
  }
  // Pad remaining
  while (cells.length < width) {
    cells.push({ char: ' ', fg: '', bg: defaultBg, style: '' });
  }
  return cells;
}

function textToRenderCells(text: string, fgColor: string, bgColor: string, width: number): RenderCell[] {
  const cells: RenderCell[] = [];
  for (let i = 0; i < width; i++) {
    cells.push({
      char: (i < text.length ? text[i] : ' '),
      fg: fgColor,
      bg: bgColor,
      style: '',
    });
  }
  return cells;
}

// --- Weather display ---

function weatherDisplay(state: GameState): Segment[] {
  const w = state.weather;
  let icon: string;
  let hanzi: string;
  let name: string;
  switch (w.current) {
    case WeatherType.Clear:  icon = '☀'; hanzi = '晴'; name = 'Sun';   break;
    case WeatherType.Cloudy: icon = '☁'; hanzi = '云'; name = 'Cloud'; break;
    case WeatherType.Rain:   icon = '☂'; hanzi = '雨'; name = 'Rain';  break;
    case WeatherType.Wind:   icon = '≋'; hanzi = '风'; name = 'Wind';  break;
  }
  const filled = Math.ceil(w.intensity * 3);
  const dots = '●'.repeat(filled) + '○'.repeat(3 - filled);
  let nightStr = '';
  if (w.isNight || w.nightPhase > 0.1) {
    nightStr = ' ☾';
  }
  return [
    { text: `${hanzi} ${name} ${dots}${nightStr}`, fg: HUD.fg, bg: '' },
  ];
}

// --- Water meter ---

function waterMeter(waterLevel: number): string {
  // 0-16%=◇◇◇, 17-33%=⬙◇◇, 34-50%=◆◇◇, 51-66%=◆⬙◇, 67-83%=◆◆◇, 84-99%=◆◆⬙, 100%=◆◆◆
  const pct = waterLevel;
  if (pct >= 100) return '◆◆◆';
  if (pct >= 84) return '◆◆⬙';
  if (pct >= 67) return '◆◆◇';
  if (pct >= 51) return '◆⬙◇';
  if (pct >= 34) return '◆◇◇';
  if (pct >= 17) return '⬙◇◇';
  return '◇◇◇';
}

// --- Growth progress bar ---

function growthBar(plant: { stage: PlantStage; growthProgress: number }, species: { growthTicks: number[] }): string {
  if (plant.stage >= PlantStage.Flowering) return '▓▓▓▓▓';
  const needed = species.growthTicks[plant.stage] || 1;
  const ratio = Math.min(1, plant.growthProgress / needed);
  const filled = Math.round(ratio * 5);
  return '▓'.repeat(filled) + '░'.repeat(5 - filled);
}

// --- Main HUD render ---

export function renderHud(state: GameState, cols: number): RenderCell[][] {
  const rows: RenderCell[][] = [];
  const hudBg = HUD.bg;
  const hudFg = HUD.fg;
  const dimFg = HUD.fgDim;
  const waterColor = fg(75);

  // === Dialog mode: rows 1 & 2 show pinyin ===
  if (state.mode === InputMode.Dialog && state.dialog.active) {
    const tree = getDialogById(state.dialog.treeId);
    const d = state.dialog;

    // Row 1: accumulated speech pinyin
    let row1Text = ' ';
    if (tree) {
      const pinyinParts: string[] = [];
      if (d.phase === 'speech') {
        for (let i = 0; i <= Math.min(d.lineIndex, tree.lines.length - 1); i++) {
          pinyinParts.push(tree.lines[i].pinyin);
        }
      } else {
        for (let i = 0; i < tree.lines.length; i++) {
          pinyinParts.push(tree.lines[i].pinyin);
        }
      }
      row1Text = ' ' + pinyinParts.join('  ');
    }
    rows.push(textToRenderCells(row1Text.slice(0, cols), dimFg, hudBg, cols));

    // Row 2: question pinyin or followup/failure pinyin
    let row2Text = '';
    if (tree) {
      if (d.phase === 'question') {
        row2Text = ' ' + tree.question.pinyin;
      } else if (d.phase === 'result') {
        if (d.answeredCorrectly) {
          row2Text = ' ' + tree.followup.pinyin;
        } else {
          row2Text = ' bú duì! xià cì zài shìshi ba.';
        }
      }
    }
    rows.push(textToRenderCells(row2Text.slice(0, cols), dimFg, hudBg, cols));

    // Row 3: dialog hints
    const line3 = ' space:advance  1/2/3:answer  esc:exit';
    rows.push(textToRenderCells(line3, dimFg, hudBg, cols));
    return rows;
  }

  // === Row 1: Tool | Weather | [VISUAL] ===
  const segments: Segment[] = [];
  segments.push({ text: ' ', fg: '', bg: '' });

  // Tool segment
  const toolColor = state.tool === ToolType.Plant ? TOOL_COLORS.plant
    : state.tool === ToolType.Water ? TOOL_COLORS.water
    : TOOL_COLORS.harvest;

  if (state.tool === ToolType.Plant) {
    const seedSpecies = getSpecies(state.selectedSeed);
    const seedHanzi = seedSpecies?.hanzi || '?';
    const seedCount = state.inventory.seeds[state.selectedSeed] || 0;
    // Get the flowering color for selected seed
    const floweringColor = seedSpecies ? plantFg(seedSpecies.id, PlantStage.Flowering, 0) : '';
    segments.push({ text: '1:Plant(', fg: toolColor, bg: '' });
    segments.push({ text: seedHanzi, fg: floweringColor || toolColor, bg: '' });
    segments.push({ text: `x${seedCount})`, fg: toolColor, bg: '' });
  } else if (state.tool === ToolType.Water) {
    segments.push({ text: '2:Water', fg: toolColor, bg: '' });
  } else {
    segments.push({ text: '3:Harvest', fg: toolColor, bg: '' });
  }

  segments.push({ text: ' | ', fg: dimFg, bg: '' });

  // Weather segment
  segments.push(...weatherDisplay(state));

  // [VISUAL] right-aligned if in visual mode
  if (state.mode === InputMode.Visual) {
    // Calculate how many chars we've used so far
    let usedLen = 0;
    for (const seg of segments) usedLen += seg.text.length;
    const visualTag = '[VISUAL]';
    const padding = Math.max(1, cols - usedLen - visualTag.length);
    segments.push({ text: ' '.repeat(padding), fg: '', bg: '' });
    segments.push({ text: visualTag, fg: fg(201), bg: '' });
  }

  rows.push(renderColoredRow(segments, cols, hudBg));

  // === Row 2: Water meter | Position | Plant/Bird info ===
  if (state.mode === InputMode.Command) {
    const cmdLine = ` :${state.commandBuffer}\u2588`;
    rows.push(textToRenderCells(cmdLine, hudFg, hudBg, cols));
  } else {
    const cell = state.grid[state.cursor.row]?.[state.cursor.col];
    const row2Segments: Segment[] = [];
    row2Segments.push({ text: ' ', fg: '', bg: '' });

    // Water meter
    const wLevel = cell ? cell.waterLevel : 0;
    row2Segments.push({ text: waterMeter(wLevel), fg: waterColor, bg: '' });

    // Position
    row2Segments.push({ text: ` [${state.cursor.row},${state.cursor.col}]`, fg: dimFg, bg: '' });

    // Bird at cursor?
    const birdAtCursor = getBirdAtPosition(state, state.cursor.row, state.cursor.col);
    if (birdAtCursor && birdAtCursor.state === 'resting') {
      const bDef = getBirdTypeDef(birdAtCursor.type);
      const bColor = fg(BIRD_COLORS[birdAtCursor.type]);
      row2Segments.push({ text: ' ', fg: '', bg: '' });
      row2Segments.push({ text: bDef.hanzi, fg: bColor, bg: '' });
      row2Segments.push({ text: ` ${bDef.name} [t]`, fg: hudFg, bg: '' });
    } else if (cell?.plant) {
      const species = getSpecies(cell.plant.speciesId);
      if (species) {
        const stageName = PlantStage[cell.plant.stage];
        const flowerColor = plantFg(species.id, PlantStage.Flowering, cell.plant.colorVariant);
        const bar = growthBar(cell.plant, species);
        row2Segments.push({ text: ' ', fg: '', bg: '' });
        row2Segments.push({ text: species.hanzi, fg: flowerColor, bg: '' });
        row2Segments.push({ text: ` ${species.name} [${stageName}] `, fg: hudFg, bg: '' });
        row2Segments.push({ text: bar, fg: fg(82), bg: '' });
      }
    }

    rows.push(renderColoredRow(row2Segments, cols, hudBg));
  }

  // === Row 3: Shortened hint text ===
  const line3 = ' hjkl:move  space:use  tab:tool  s:seed  t:talk  ?:help  :q';
  rows.push(textToRenderCells(line3, dimFg, hudBg, cols));

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
