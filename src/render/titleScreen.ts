import * as readline from 'readline';
import { moveTo, clearScreen, hideCursor, fg, bg, fgRgb, reset } from '../terminal/ansi.js';
import { enterFullScreen, getTerminalSize } from '../terminal/screen.js';
import { BIRD_TYPES } from '../data/birds.js';
import { getSpecies } from '../data/plants.js';
import { plantFg } from './palette.js';
import { PlantStage } from '../types.js';
import { getGeneratedDialogCount, restoreDefaultDialog, generateDialogHeadless } from '../dialog/dialogRefresh.js';
import { saveSettings } from '../game/settings.js';
import type { Cell, GameSettings } from '../types.js';
import type { AudioSystem } from '../audio/audioSystem.js';

export type TitleChoice = 'start:beach' | 'start:lake' | 'start:river' | 'delete_save' | 'quit';

export interface SaveInfo {
  grid?: Cell[][];
  tickCount?: number;
  grownSpeciesIds?: Set<string>;
}

const BOX_W = 40;
const BORDER = fg(245);
const BG = bg(235);
const TITLE_BROWN = fgRgb(200, 150, 80);
const GOLD = fg(220);
const DIM = fg(245);
const GREEN = fg(82);
const RED = fg(196);

// All 16 species in display order (2 rows of 8)
const SHOWCASE_ROW1 = ['grass', 'flower', 'tree', 'lotus', 'cactus', 'moss', 'maple', 'fang'];
const SHOWCASE_ROW2 = ['miao', 'guo', 'cha', 'zhu', 'tao', 'ju', 'mei', 'lan'];

const HSK_LEVELS = [1, 2, 3, 4, 5, 6];
const MODELS = ['haiku', 'sonnet', 'opus'];

function visWidth(s: string): number {
  const stripped = s.replace(/\x1b\[[0-9;]*m/g, '');
  let w = 0;
  for (const ch of stripped) {
    const code = ch.codePointAt(0) ?? 0;
    // Skip zero-width combining characters (U+0300-U+036F)
    if (code >= 0x0300 && code <= 0x036F) continue;
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

function buildShowcaseRow(speciesIds: string[], grownSpeciesIds: Set<string> | undefined): string {
  const parts: string[] = [];
  for (const id of speciesIds) {
    const species = getSpecies(id);
    if (!species) continue;
    const grown = grownSpeciesIds?.has(id) ?? false;
    const stage = grown ? PlantStage.Flowering : PlantStage.Growing;
    const ch = species.stages[stage];
    const color = grown ? plantFg(id, PlantStage.Flowering) : fg(240);
    parts.push(`${color}${ch}${reset}${BG}`);
  }
  return `·${parts.join('·')}·`;
}

interface DialogFormState {
  mode: 'add' | 'replace';
  hskLevel: number;
  topics: string;
  model: string;
  field: 'hsk' | 'topics' | 'model';  // which field is active for editing
  status: string;  // '', 'generating', 'done', or error message
  statusColor: string;
}

type Menu = 'main' | 'map_select' | 'settings' | 'dialog_form';

function buildScreen(
  menu: Menu,
  saveInfo: SaveInfo | null,
  bird: typeof BIRD_TYPES[number],
  settings: GameSettings,
  dialogForm: DialogFormState,
): string[] {
  const innerW = BOX_W - 2;
  const birdColor = fg(bird.color256);
  const lines: string[] = [];

  // Top border
  lines.push(`${BORDER}${BG}╔${'═'.repeat(innerW)}╗${reset}`);
  lines.push(emptyLine(innerW));

  // Title
  const titleContent = `${TITLE_BROWN}花 园${reset}${BG}  ${TITLE_BROWN}Huāyuán${reset}${BG}`;
  lines.push(boxLine(centerInBox(titleContent, innerW), innerW));
  lines.push(emptyLine(innerW));

  // Bird art
  for (const artLine of bird.art) {
    const colored = `${birdColor}${artLine}${reset}${BG}`;
    lines.push(boxLine(centerInBox(colored, innerW), innerW));
  }
  lines.push(emptyLine(innerW));

  // Plant showcase (2 rows of 8, always visible)
  const grownIds = saveInfo?.grownSpeciesIds;
  const row1 = buildShowcaseRow(SHOWCASE_ROW1, grownIds);
  const row2 = buildShowcaseRow(SHOWCASE_ROW2, grownIds);
  lines.push(boxLine(centerInBox(row1, innerW), innerW));
  lines.push(boxLine(centerInBox(row2, innerW), innerW));
  lines.push(emptyLine(innerW));

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
    lines.push(boxLine(centerInBox(`${GOLD}[2]${reset}${BG} Settings`, innerW), innerW));
    lines.push(boxLine(centerInBox(`${GOLD}[3]${reset}${BG} Quit`, innerW), innerW));
  } else if (menu === 'map_select') {
    // Map selection submenu
    lines.push(boxLine(centerInBox('Choose your garden:', innerW), innerW));
    lines.push(emptyLine(innerW));
    lines.push(boxLine(centerInBox(`${GOLD}[1]${reset}${BG} Beach  ${DIM}~ocean shore~${reset}${BG}`, innerW), innerW));
    lines.push(boxLine(centerInBox(`${GOLD}[2]${reset}${BG} Lake   ${DIM}~central lake~${reset}${BG}`, innerW), innerW));
    lines.push(boxLine(centerInBox(`${GOLD}[3]${reset}${BG} River  ${DIM}~winding path~${reset}${BG}`, innerW), innerW));
    lines.push(emptyLine(innerW));
    lines.push(boxLine(centerInBox(`${DIM}[esc] back${reset}${BG}`, innerW), innerW));
  } else if (menu === 'settings') {
    // Settings submenu
    const soundLabel = settings.soundEnabled ? 'ON' : 'OFF';
    const weatherLabel = settings.weatherEffectsEnabled ? 'ON' : 'OFF';
    lines.push(boxLine(centerInBox(`${GOLD}[s]${reset}${BG} Sound: ${soundLabel}`, innerW), innerW));
    lines.push(boxLine(centerInBox(`${GOLD}[w]${reset}${BG} Weather FX: ${weatherLabel}`, innerW), innerW));
    lines.push(emptyLine(innerW));

    // Dialog options
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
    if (saveInfo) {
      lines.push(boxLine(centerInBox(`${GOLD}[4]${reset}${BG} Delete save`, innerW), innerW));
    }
    lines.push(boxLine(centerInBox(`${DIM}[esc] back${reset}${BG}`, innerW), innerW));
  } else {
    // Dialog generation form
    const modeLabel = dialogForm.mode === 'add' ? 'Generate new' : 'Replace all';
    lines.push(boxLine(centerInBox(modeLabel, innerW), innerW));
    lines.push(emptyLine(innerW));

    // HSK level field
    const hskActive = dialogForm.field === 'hsk';
    const hskPrefix = hskActive ? `${GOLD}> ` : '  ';
    const hskSuffix = hskActive ? `${reset}${BG}` : '';
    lines.push(boxLine(centerInBox(`${hskPrefix}HSK level: ${dialogForm.hskLevel}${hskSuffix}`, innerW), innerW));
    if (hskActive) {
      lines.push(boxLine(centerInBox(`${DIM}[←/→] change  [↓/tab] next${reset}${BG}`, innerW), innerW));
    }

    // Topics field
    const topicsActive = dialogForm.field === 'topics';
    const topicsPrefix = topicsActive ? `${GOLD}> ` : '  ';
    const topicsSuffix = topicsActive ? `${reset}${BG}` : '';
    const topicsDisplay = dialogForm.topics || `${DIM}(none)${reset}${BG}`;
    lines.push(boxLine(centerInBox(`${topicsPrefix}Topics: ${topicsDisplay}${topicsSuffix}`, innerW), innerW));
    if (topicsActive) {
      lines.push(boxLine(centerInBox(`${DIM}type to edit  [↓/tab] next${reset}${BG}`, innerW), innerW));
    }

    // Model field
    const modelActive = dialogForm.field === 'model';
    const modelPrefix = modelActive ? `${GOLD}> ` : '  ';
    const modelSuffix = modelActive ? `${reset}${BG}` : '';
    lines.push(boxLine(centerInBox(`${modelPrefix}Model: ${dialogForm.model}${modelSuffix}`, innerW), innerW));
    if (modelActive) {
      lines.push(boxLine(centerInBox(`${DIM}[←/→] change  [enter] go${reset}${BG}`, innerW), innerW));
    }

    lines.push(emptyLine(innerW));

    // Status or action prompt
    if (dialogForm.status === 'generating') {
      lines.push(boxLine(centerInBox(`${DIM}Generating...${reset}${BG}`, innerW), innerW));
    } else if (dialogForm.status) {
      lines.push(boxLine(centerInBox(`${dialogForm.statusColor}${dialogForm.status}${reset}${BG}`, innerW), innerW));
    }

    lines.push(boxLine(centerInBox(`${GOLD}[enter]${reset}${BG} Generate  ${DIM}[esc] back${reset}${BG}`, innerW), innerW));
  }

  lines.push(emptyLine(innerW));
  lines.push(`${BORDER}${BG}╚${'═'.repeat(innerW)}╝${reset}`);

  return lines;
}

function renderScreen(lines: string[]): void {
  const { rows: termRows, cols: termCols } = getTerminalSize();
  const startRow = Math.max(0, Math.floor((termRows - lines.length) / 2));
  const startCol = Math.max(0, Math.floor((termCols - BOX_W) / 2));

  let output = clearScreen + hideCursor;
  for (let i = 0; i < lines.length; i++) {
    output += moveTo(startRow + i, startCol) + lines[i];
  }
  process.stdout.write(output);
}

export function showTitleScreen(
  saveInfo: SaveInfo | null,
  audioSystem: AudioSystem,
  settings: GameSettings,
): Promise<TitleChoice> {
  enterFullScreen();

  const bird = BIRD_TYPES[Math.floor(Math.random() * BIRD_TYPES.length)];
  let menu: Menu = 'main';

  const dialogForm: DialogFormState = {
    mode: 'add',
    hskLevel: 3,
    topics: '',
    model: 'haiku',
    field: 'hsk',
    status: '',
    statusColor: '',
  };

  // Play bird chirp on title load
  audioSystem.playChirp(bird.type);

  function redraw() {
    renderScreen(buildScreen(menu, saveInfo, bird, settings, dialogForm));
  }

  redraw();

  return new Promise<TitleChoice>((resolve) => {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    process.stdin.resume();
    readline.emitKeypressEvents(process.stdin);

    const onResize = () => { redraw(); };
    process.stdout.on('resize', onResize);

    function cleanup() {
      process.stdout.removeListener('resize', onResize);
      process.stdin.removeListener('keypress', onKey);
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
      }
      process.stdin.pause();
    }

    let generating = false;

    const onKey = (_str: string | undefined, key: readline.Key | undefined) => {
      if (!key) return;
      if (generating) return;  // ignore input while API call is in progress

      if (key.ctrl && key.name === 'c') {
        cleanup();
        resolve('quit');
        return;
      }

      if (menu === 'main') {
        if (key.sequence === '1') {
          if (saveInfo) {
            cleanup(); resolve('start:river');
          } else {
            menu = 'map_select';
            redraw();
          }
        }
        else if (key.sequence === '2') {
          menu = 'settings';
          redraw();
        }
        else if (key.sequence === '3') { cleanup(); resolve('quit'); }
      } else if (menu === 'map_select') {
        if (key.sequence === '1') { cleanup(); resolve('start:beach'); }
        else if (key.sequence === '2') { cleanup(); resolve('start:lake'); }
        else if (key.sequence === '3') { cleanup(); resolve('start:river'); }
        else if (key.name === 'escape') {
          menu = 'main';
          redraw();
        }
      } else if (menu === 'settings') {
        if (key.sequence === 's') {
          settings.soundEnabled = !settings.soundEnabled;
          audioSystem.setMuted(!settings.soundEnabled);
          saveSettings(settings);
          redraw();
        }
        else if (key.sequence === 'w') {
          settings.weatherEffectsEnabled = !settings.weatherEffectsEnabled;
          saveSettings(settings);
          redraw();
        }
        else if (key.sequence === '1') {
          dialogForm.mode = 'add';
          dialogForm.status = '';
          dialogForm.field = 'hsk';
          menu = 'dialog_form';
          redraw();
        }
        else if (key.sequence === '2') {
          dialogForm.mode = 'replace';
          dialogForm.status = '';
          dialogForm.field = 'hsk';
          menu = 'dialog_form';
          redraw();
        }
        else if (key.sequence === '3') {
          restoreDefaultDialog();
          redraw();
        }
        else if (key.sequence === '4' && saveInfo) {
          cleanup();
          resolve('delete_save');
        }
        else if (key.name === 'escape') {
          menu = 'main';
          redraw();
        }
      } else if (menu === 'dialog_form') {
        // Dialog generation form
        if (key.name === 'escape') {
          menu = 'settings';
          redraw();
          return;
        }

        if (key.name === 'return') {
          // Start generation
          generating = true;
          dialogForm.status = 'generating';
          dialogForm.statusColor = '';
          redraw();

          generateDialogHeadless(
            dialogForm.mode,
            dialogForm.hskLevel,
            dialogForm.topics,
            dialogForm.model,
          ).then((result) => {
            generating = false;
            if (result.ok) {
              dialogForm.status = `Done! ${result.count} dialogs`;
              dialogForm.statusColor = GREEN;
            } else {
              dialogForm.status = `Error: ${result.error}`;
              dialogForm.statusColor = RED;
            }
            redraw();
          });
          return;
        }

        // Field navigation
        if (key.name === 'tab' || key.name === 'down') {
          if (dialogForm.field === 'hsk') dialogForm.field = 'topics';
          else if (dialogForm.field === 'topics') dialogForm.field = 'model';
          else dialogForm.field = 'hsk';
          redraw();
          return;
        }
        if (key.name === 'up') {
          if (dialogForm.field === 'model') dialogForm.field = 'topics';
          else if (dialogForm.field === 'topics') dialogForm.field = 'hsk';
          else dialogForm.field = 'model';
          redraw();
          return;
        }

        // Field-specific input
        if (dialogForm.field === 'hsk') {
          if (key.name === 'left' || key.name === 'right') {
            const idx = HSK_LEVELS.indexOf(dialogForm.hskLevel);
            const dir = key.name === 'right' ? 1 : -1;
            dialogForm.hskLevel = HSK_LEVELS[(idx + dir + HSK_LEVELS.length) % HSK_LEVELS.length];
            redraw();
          }
        } else if (dialogForm.field === 'topics') {
          if (key.name === 'backspace') {
            dialogForm.topics = dialogForm.topics.slice(0, -1);
            redraw();
          } else if (key.sequence && key.sequence.length === 1 && !key.ctrl && !key.meta) {
            dialogForm.topics += key.sequence;
            redraw();
          }
        } else if (dialogForm.field === 'model') {
          if (key.name === 'left' || key.name === 'right') {
            const idx = MODELS.indexOf(dialogForm.model);
            const dir = key.name === 'right' ? 1 : -1;
            dialogForm.model = MODELS[(idx + dir + MODELS.length) % MODELS.length];
            redraw();
          }
        }
      }
    };

    process.stdin.on('keypress', onKey);
  });
}
