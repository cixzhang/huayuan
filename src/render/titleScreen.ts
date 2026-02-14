import * as readline from 'readline';
import { moveTo, clearScreen, hideCursor, fg, bg, fgRgb, reset } from '../terminal/ansi.js';
import { enterFullScreen, getTerminalSize } from '../terminal/screen.js';
import { BIRD_TYPES } from '../data/birds.js';
import { getSpecies } from '../data/plants.js';
import { plantFg } from './palette.js';
import { PlantStage } from '../types.js';
import { getGeneratedDialogCount, restoreDefaultDialog } from '../dialog/dialogRefresh.js';
import type { Cell } from '../types.js';

export type TitleChoice = 'start' | 'dialog_add' | 'dialog_replace' | 'quit';

interface SaveInfo {
  grid?: Cell[][];
  tickCount?: number;
}

const BOX_W = 40;
const BORDER = fg(245);
const BG = bg(235);
const TITLE_GREEN = fgRgb(100, 240, 100);
const TITLE_BROWN = fgRgb(200, 150, 80);
const GOLD = fg(220);
const DIM = fg(245);

function visWidth(s: string): number {
  const stripped = s.replace(/\x1b\[[0-9;]*m/g, '');
  let w = 0;
  for (const ch of stripped) {
    const code = ch.codePointAt(0) ?? 0;
    w += (code > 0x2E7F) ? 2 : 1;
  }
  return w;
}

function boxLine(content: string, innerW: number): string {
  const w = visWidth(content);
  const right = Math.max(0, innerW - w);
  return `${BORDER}${BG}║${reset}${BG}${content}${' '.repeat(right)}${reset}${BORDER}${BG}║${reset}`;
}

function centerInBox(content: string, innerW: number): string {
  const w = visWidth(content);
  const total = innerW - w;
  const left = Math.max(0, Math.floor(total / 2));
  const right = Math.max(0, total - left);
  return `${' '.repeat(left)}${content}${' '.repeat(right)}`;
}

function emptyLine(innerW: number): string {
  return boxLine(' '.repeat(innerW), innerW);
}

function getUniquePlantSpecies(grid: Cell[][]): string[] {
  const seen = new Set<string>();
  for (const row of grid) {
    for (const cell of row) {
      if (cell.plant) {
        seen.add(cell.plant.speciesId);
      }
    }
  }
  return [...seen];
}

function buildPlantRow(speciesIds: string[]): string {
  if (speciesIds.length === 0) return '';
  const parts: string[] = [];
  for (const id of speciesIds) {
    const species = getSpecies(id);
    if (!species) continue;
    const ch = species.stages[PlantStage.Flowering];
    const color = plantFg(id, PlantStage.Flowering);
    parts.push(`${color}${ch}${reset}${BG}`);
  }
  return `·${parts.join('·')}·`;
}

type Menu = 'main' | 'dialog';

function buildScreen(menu: Menu, saveInfo: SaveInfo | null, bird: typeof BIRD_TYPES[number]): string[] {
  const innerW = BOX_W - 2;
  const birdColor = fg(bird.color256);
  const lines: string[] = [];

  // Top border
  lines.push(`${BORDER}${BG}╔${'═'.repeat(innerW)}╗${reset}`);
  lines.push(emptyLine(innerW));

  // Title
  const titleContent = `${TITLE_GREEN}花 园${reset}${BG}  ${TITLE_BROWN}Huāyuán${reset}${BG}`;
  lines.push(boxLine(centerInBox(titleContent, innerW), innerW));
  lines.push(emptyLine(innerW));

  // Bird art
  for (const artLine of bird.art) {
    const colored = `${birdColor}${artLine}${reset}${BG}`;
    lines.push(boxLine(centerInBox(colored, innerW), innerW));
  }
  lines.push(emptyLine(innerW));

  // Plant decoration row
  if (saveInfo?.grid) {
    const speciesIds = getUniquePlantSpecies(saveInfo.grid);
    if (speciesIds.length > 0) {
      const plantRow = buildPlantRow(speciesIds);
      lines.push(boxLine(centerInBox(plantRow, innerW), innerW));
      lines.push(emptyLine(innerW));
    }
  }

  if (menu === 'main') {
    // Save status
    if (saveInfo) {
      const tick = saveInfo.tickCount ?? 0;
      lines.push(boxLine(centerInBox(`Save found (tick ${tick})`, innerW), innerW));
    } else {
      lines.push(boxLine(centerInBox('No save found', innerW), innerW));
    }
    lines.push(emptyLine(innerW));

    // Main menu
    lines.push(boxLine(centerInBox(`${GOLD}[1]${reset}${BG} Start game`, innerW), innerW));
    lines.push(boxLine(centerInBox(`${GOLD}[2]${reset}${BG} Generate dialog`, innerW), innerW));
    lines.push(boxLine(centerInBox(`${GOLD}[3]${reset}${BG} Quit`, innerW), innerW));
  } else {
    // Dialog sub-menu
    const count = getGeneratedDialogCount();
    const hasKey = !!process.env['ANTHROPIC_API_KEY'];
    if (count > 0) {
      lines.push(boxLine(centerInBox(`${count} generated dialogs`, innerW), innerW));
    } else {
      lines.push(boxLine(centerInBox('No generated dialog', innerW), innerW));
    }
    if (!hasKey) {
      lines.push(boxLine(centerInBox(`${DIM}(set ANTHROPIC_API_KEY)${reset}${BG}`, innerW), innerW));
    }
    lines.push(emptyLine(innerW));

    lines.push(boxLine(centerInBox(`${GOLD}[1]${reset}${BG} Generate new dialog`, innerW), innerW));
    lines.push(boxLine(centerInBox(`${GOLD}[2]${reset}${BG} Replace dialog`, innerW), innerW));
    lines.push(boxLine(centerInBox(`${GOLD}[3]${reset}${BG} Restore default`, innerW), innerW));
    lines.push(boxLine(centerInBox(`${DIM}[esc] back${reset}${BG}`, innerW), innerW));
  }

  lines.push(emptyLine(innerW));
  lines.push(`${BORDER}${BG}╚${'═'.repeat(innerW)}╝${reset}`);

  return lines;
}

function render(lines: string[]): void {
  const { rows: termRows, cols: termCols } = getTerminalSize();
  const startRow = Math.max(0, Math.floor((termRows - lines.length) / 2));
  const startCol = Math.max(0, Math.floor((termCols - BOX_W) / 2));

  let output = clearScreen + hideCursor;
  for (let i = 0; i < lines.length; i++) {
    output += moveTo(startRow + i, startCol) + lines[i];
  }
  process.stdout.write(output);
}

export function showTitleScreen(saveInfo: SaveInfo | null): Promise<TitleChoice> {
  enterFullScreen();

  const bird = BIRD_TYPES[Math.floor(Math.random() * BIRD_TYPES.length)];
  let menu: Menu = 'main';

  render(buildScreen(menu, saveInfo, bird));

  return new Promise<TitleChoice>((resolve) => {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    process.stdin.resume();
    readline.emitKeypressEvents(process.stdin);

    function cleanup() {
      process.stdin.removeListener('keypress', onKey);
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
      }
      process.stdin.pause();
    }

    const onKey = (_str: string | undefined, key: readline.Key | undefined) => {
      if (!key) return;

      if (key.ctrl && key.name === 'c') {
        cleanup();
        resolve('quit');
        return;
      }

      if (menu === 'main') {
        if (key.sequence === '1') { cleanup(); resolve('start'); }
        else if (key.sequence === '2') {
          menu = 'dialog';
          render(buildScreen(menu, saveInfo, bird));
        }
        else if (key.sequence === '3') { cleanup(); resolve('quit'); }
      } else {
        if (key.sequence === '1') { cleanup(); resolve('dialog_add'); }
        else if (key.sequence === '2') { cleanup(); resolve('dialog_replace'); }
        else if (key.sequence === '3') {
          restoreDefaultDialog();
          menu = 'main';
          render(buildScreen(menu, saveInfo, bird));
        }
        else if (key.name === 'escape') {
          menu = 'main';
          render(buildScreen(menu, saveInfo, bird));
        }
      }
    };

    process.stdin.on('keypress', onKey);
  });
}
