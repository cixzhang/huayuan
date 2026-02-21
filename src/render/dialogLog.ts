import type { GameState, RenderCell } from '../types.js';
import { HELP, BIRD_COLORS } from './palette.js';
import { fg } from '../terminal/ansi.js';
import { getBirdTypeDef } from '../data/birds.js';

const BOX_WIDTH = 80; // terminal columns

function fillRow(text: string, width: number): string {
  if (text.length >= width) return text.slice(0, width);
  return text + ' '.repeat(width - text.length);
}

export function renderDialogLog(state: GameState, cols: number, gridRows: number): RenderCell[][] {
  const innerWidth = BOX_WIDTH / 2 - 2;
  const contentLines: { text: string; color?: string }[] = [];

  contentLines.push({ text: '' });
  const title = 'Dialog Log';
  const pad = Math.max(0, Math.floor((innerWidth - title.length) / 2));
  contentLines.push({ text: ' '.repeat(pad) + title });
  contentLines.push({ text: '' });

  if (state.dialogLog.length === 0) {
    contentLines.push({ text: '  No conversations yet.' });
    contentLines.push({ text: '  Talk to birds with [t]' });
  } else {
    // Show entries from logScroll position
    const startIdx = Math.max(0, state.dialogLog.length - 1 - state.logScroll);
    const visibleCount = Math.min(5, state.dialogLog.length);
    const fromIdx = Math.max(0, startIdx - visibleCount + 1);

    for (let i = fromIdx; i <= startIdx; i++) {
      const entry = state.dialogLog[i];
      const birdDef = getBirdTypeDef(entry.birdType);
      const birdColor = fg(BIRD_COLORS[entry.birdType]);
      const marker = entry.answeredCorrectly ? ' ✓' : ' ✗';
      const markerColor = entry.answeredCorrectly ? fg(82) : fg(196);

      contentLines.push({ text: '  ' + '─'.repeat(innerWidth - 4) });
      contentLines.push({
        text: `  ${birdDef.hanzi} ${birdDef.name}${marker}`,
        color: birdColor,
      });

      // Speech lines
      for (const line of entry.lines) {
        const wrapped = line.text.slice(0, innerWidth - 4);
        contentLines.push({ text: `  ${wrapped}` });
        if (state.showPinyin) {
          contentLines.push({ text: `  ${line.pinyin.slice(0, innerWidth - 4)}`, color: fg(245) });
        }
      }

      // Question
      contentLines.push({ text: '' });
      contentLines.push({ text: `  ${entry.question.text.slice(0, innerWidth - 4)}` });

      // Options with markers
      for (let j = 0; j < entry.options.length; j++) {
        const opt = entry.options[j];
        const optMarker = opt.isCorrect ? '✓' : ' ';
        const optText = opt.text || opt.english || opt.pinyin;
        contentLines.push({ text: `  [${j + 1}] ${optMarker} ${optText.slice(0, innerWidth - 10)}` });
      }

      // Seed reward
      if (entry.seedReward && entry.answeredCorrectly) {
        contentLines.push({ text: `  +1 seed: ${entry.seedReward}`, color: fg(82) });
      }

      contentLines.push({ text: '' });
    }
  }

  contentLines.push({ text: '' });
  const scrollInfo = state.dialogLog.length > 0
    ? `  j/k:scroll  esc:exit  (${state.logScroll + 1}/${state.dialogLog.length})`
    : '  esc:exit';
  contentLines.push({ text: scrollInfo });

  // Render overlay
  const totalHeight = Math.min(contentLines.length + 2, gridRows);
  const startRow = Math.max(0, Math.floor((gridRows - totalHeight) / 2));
  const startCol = Math.max(0, Math.floor((cols - BOX_WIDTH / 2) / 2));

  const overlay: RenderCell[][] = [];

  for (let r = 0; r < gridRows; r++) {
    const row: RenderCell[] = [];
    const lineIdx = r - startRow;

    for (let c = 0; c < cols; c++) {
      const charIdx = c - startCol;

      if (lineIdx < 0 || lineIdx >= totalHeight || charIdx < 0 || charIdx >= BOX_WIDTH / 2) {
        row.push({ char: ' ', fg: '', bg: '', style: '' });
        continue;
      }

      if (lineIdx === 0) {
        let borderChar = ' ';
        if (charIdx === 0) borderChar = '╔';
        else if (charIdx === BOX_WIDTH / 2 - 1) borderChar = '╗';
        else borderChar = '═';
        row.push({ char: borderChar, fg: HELP.fg, bg: HELP.bg, style: '' });
        continue;
      }

      if (lineIdx === totalHeight - 1) {
        let borderChar = ' ';
        if (charIdx === 0) borderChar = '╚';
        else if (charIdx === BOX_WIDTH / 2 - 1) borderChar = '╝';
        else borderChar = '═';
        row.push({ char: borderChar, fg: HELP.fg, bg: HELP.bg, style: '' });
        continue;
      }

      const contentIdx = lineIdx - 1;
      if (contentIdx >= 0 && contentIdx < contentLines.length) {
        const line = contentLines[contentIdx];
        if (charIdx === 0) {
          row.push({ char: '║', fg: HELP.fg, bg: HELP.bg, style: '' });
        } else if (charIdx === BOX_WIDTH / 2 - 1) {
          row.push({ char: '║', fg: HELP.fg, bg: HELP.bg, style: '' });
        } else {
          const textIdx = charIdx - 1;
          const text = line.text;
          const ch = textIdx < text.length ? text[textIdx] : ' ';
          row.push({
            char: ch,
            fg: line.color || HELP.fg,
            bg: HELP.bg,
            style: '',
          });
        }
      } else {
        if (charIdx === 0 || charIdx === BOX_WIDTH / 2 - 1) {
          row.push({ char: '║', fg: HELP.fg, bg: HELP.bg, style: '' });
        } else {
          row.push({ char: ' ', fg: HELP.fg, bg: HELP.bg, style: '' });
        }
      }
    }
    overlay.push(row);
  }

  return overlay;
}
