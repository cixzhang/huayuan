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
    case WeatherType.Neutral: icon = '·'; hanzi = '和'; name = 'Calm'; break;
    case WeatherType.Clear:  icon = '☀'; hanzi = '晴'; name = 'Sun';   break;
    case WeatherType.Cloudy: icon = '☁'; hanzi = '云'; name = 'Cloud'; break;
    case WeatherType.Rain:   icon = '☂'; hanzi = '雨'; name = 'Rain';  break;
    case WeatherType.Wind:   icon = '≋'; hanzi = '风'; name = 'Wind';  break;
  }
  if ((w.isNight || w.nightPhase > 0.1) && w.current === WeatherType.Clear) {
    icon = '☾'; name = 'Clear';
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

  // === Dialog mode: rows 1-2 show scrollable pinyin, row 3 hints ===
  if (state.mode === InputMode.Dialog && state.dialog.active) {
    const tree = getDialogById(state.dialog.treeId);
    const d = state.dialog;

    // Build pinyin content lines, wrapping long text across multiple lines
    const pinyinLines: string[] = [];
    const wrapWidth = cols - 1; // leave 1 char left margin

    const wrapPinyin = (text: string): void => {
      if (text.length <= wrapWidth) {
        pinyinLines.push(' ' + text);
      } else {
        let remaining = text;
        while (remaining.length > 0) {
          const chunk = remaining.slice(0, wrapWidth);
          pinyinLines.push(' ' + chunk);
          remaining = remaining.slice(wrapWidth);
        }
      }
    };

    if (tree) {
      // Speech pinyin
      if (d.phase === 'speech') {
        const idx = Math.min(d.lineIndex, tree.lines.length - 1);
        wrapPinyin(`[${idx + 1}/${tree.lines.length}] ${tree.lines[idx].pinyin}`);
      } else {
        // In question/result, show last speech line
        const last = tree.lines.length - 1;
        wrapPinyin(`[${tree.lines.length}/${tree.lines.length}] ${tree.lines[last].pinyin}`);
      }

      // Question/result pinyin
      if (d.phase === 'question') {
        wrapPinyin(tree.question.pinyin);
      } else if (d.phase === 'result') {
        if (d.answeredCorrectly) {
          wrapPinyin(tree.followup.pinyin);
        } else {
          wrapPinyin('bú duì! xià cì zài shìshi ba.');
        }
      }
    }

    // 2 visible rows for pinyin content
    const visiblePinyinRows = 2;
    const maxScroll = Math.max(0, pinyinLines.length - visiblePinyinRows);
    if (d.pinyinScroll > maxScroll) d.pinyinScroll = maxScroll;
    const canScroll = pinyinLines.length > visiblePinyinRows;

    for (let i = 0; i < visiblePinyinRows; i++) {
      const lineIdx = i + d.pinyinScroll;
      const text = lineIdx < pinyinLines.length ? pinyinLines[lineIdx] : '';
      rows.push(textToRenderCells(text.slice(0, cols), dimFg, hudBg, cols));
    }

    // Row 3: dialog hints + scroll indicator
    let line3 = ' space:advance  1/2/3:answer  esc:exit';
    if (canScroll) {
      line3 += `  j/k:pinyin [${d.pinyinScroll + 1}/${pinyinLines.length}]`;
    }
    rows.push(textToRenderCells(line3.slice(0, cols), dimFg, hudBg, cols));
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

  // Clipboard indicator
  if (state.clipboard) {
    let plantCount = 0;
    for (const row of state.clipboard.cells) {
      for (const cell of row) {
        if (cell) plantCount++;
      }
    }
    segments.push({ text: ' | ', fg: dimFg, bg: '' });
    segments.push({ text: `[Y:${plantCount}]`, fg: fg(220), bg: '' });
  }

  // Right-aligned mode tags
  if (state.mode === InputMode.Visual) {
    let usedLen = 0;
    for (const seg of segments) usedLen += seg.text.length;
    const visualTag = '[VISUAL]';
    const padding = Math.max(1, cols - usedLen - visualTag.length);
    segments.push({ text: ' '.repeat(padding), fg: '', bg: '' });
    segments.push({ text: visualTag, fg: fg(201), bg: '' });
  } else if (state.mode === InputMode.Help) {
    let usedLen = 0;
    for (const seg of segments) usedLen += seg.text.length;
    const helpTag = '[HELP]';
    const padding = Math.max(1, cols - usedLen - helpTag.length);
    segments.push({ text: ' '.repeat(padding), fg: '', bg: '' });
    segments.push({ text: helpTag, fg: fg(220), bg: '' });
  } else if (state.mode === InputMode.Log) {
    let usedLen = 0;
    for (const seg of segments) usedLen += seg.text.length;
    const logTag = '[LOG]';
    const padding = Math.max(1, cols - usedLen - logTag.length);
    segments.push({ text: ' '.repeat(padding), fg: '', bg: '' });
    segments.push({ text: logTag, fg: fg(220), bg: '' });
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

    // Position + terrain
    const terrainLabel = cell && cell.terrain !== 'soil' ? ` ${cell.terrain}` : '';
    row2Segments.push({ text: ` [${state.cursor.row},${state.cursor.col}]${terrainLabel}`, fg: dimFg, bg: '' });

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
    } else if (cell?.wildChar) {
      const wildColor = fg(65);
      row2Segments.push({ text: ' ', fg: '', bg: '' });
      row2Segments.push({ text: cell.wildChar, fg: wildColor, bg: '' });
      row2Segments.push({ text: ' Wild Plant', fg: wildColor, bg: '' });
    }

    rows.push(renderColoredRow(row2Segments, cols, hudBg));
  }

  // === Row 3: Shortened hint text ===
  let line3: string;
  if (state.mode === InputMode.Help) {
    line3 = ' j/k:scroll  ?/esc:exit';
  } else if (state.mode === InputMode.Log) {
    line3 = ' j/k:scroll  esc:exit';
  } else {
    line3 = ' hjkl:move  ␣:use  ⇥:tool  s:seed  t:talk  ?:help  :q';
  }
  rows.push(textToRenderCells(line3, dimFg, hudBg, cols));

  return rows;
}

export function renderHelpOverlay(state: GameState, cols: number, gridRows: number): RenderCell[][] {
  const helpContent = [
    '  花 园  Huāyuán  Help',
    '',
    '  Movement:',
    '    h/j/k/l  Move cursor',
    '    w/b      Jump 5 cells',
    '    G/gg     Jump bottom/top',
    '    f<char>  Find character',
    '',
    '  Tools:',
    '    1        Plant tool',
    '    2        Water tool',
    '    3        Harvest tool',
    '    tab      Cycle tools',
    '    space    Use current tool',
    '    s        Cycle seed type',
    '    x        Delete plant at cursor',
    '',
    '  Visual mode (v):',
    '    y        Yank (copy) plants',
    '    d        Delete plants → seeds',
    '    p        Paste yanked plants',
    '',
    '  Commands:',
    '    :w       Save  :log  Dialog log',
    '    :tool <name>   Switch tool',
    '    :seed <name>   Switch seed',
    '    :summon <bird>  Summon bird',
    '    :terraform <type>  Set terrain (soil/sand/river)',
    '    :q       Quit',
    '    ?        Toggle this help',
    '',
    '  Grow plants: plant → water → wait',
  ];

  // Clamp scroll so last line is reachable but not past it
  const visibleRows = gridRows - 1; // reserve 1 row for scroll indicator
  const maxScroll = Math.max(0, helpContent.length - visibleRows);
  if (state.helpScroll > maxScroll) state.helpScroll = maxScroll;

  const scrollOffset = state.helpScroll;
  const overlay: RenderCell[][] = [];

  for (let r = 0; r < gridRows; r++) {
    const row: RenderCell[] = [];
    if (r < visibleRows) {
      const lineIdx = r + scrollOffset;
      const line = lineIdx < helpContent.length ? helpContent[lineIdx] : '';
      for (let c = 0; c < cols; c++) {
        row.push({
          char: c < line.length ? line[c] : ' ',
          fg: HELP.fg,
          bg: HELP.bg,
          style: '',
        });
      }
    } else {
      // Bottom row: scroll indicator
      const indicator = `  j/k:scroll  ?/esc:exit  [${scrollOffset + 1}/${helpContent.length}]`;
      for (let c = 0; c < cols; c++) {
        row.push({
          char: c < indicator.length ? indicator[c] : ' ',
          fg: HUD.fgDim,
          bg: HELP.bg,
          style: '',
        });
      }
    }
    overlay.push(row);
  }

  return overlay;
}
