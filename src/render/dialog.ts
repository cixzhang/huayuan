import type { GameState, RenderCell } from '../types.js';
import { getDialogById, getBirdTypeDef } from '../data/birds.js';
import { getSpecies } from '../data/plants.js';
import { HELP } from './palette.js';
import { fg } from '../terminal/ansi.js';
import { BIRD_COLORS } from './palette.js';
import { getCell } from '../game/grid.js';
import { getBirdArt } from '../game/birds.js';

const BOX_WIDTH = 80;  // terminal columns wide (box spans BOX_WIDTH/2 game cells)

// Chinese punctuation for preferred break points
const CJK_PUNCTUATION = '，。！？、；：）》」』】';

function wrapText(text: string, maxWidth: number): string[] {
  if (text.length <= maxWidth) return [text];
  const lines: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= maxWidth) {
      lines.push(remaining);
      break;
    }
    // Find best break point within maxWidth
    let breakAt = maxWidth;
    // Try to break at a space (for mixed/ASCII text)
    const spaceIdx = remaining.lastIndexOf(' ', maxWidth);
    if (spaceIdx > maxWidth * 0.3) {
      breakAt = spaceIdx + 1; // include space at end of current line
    } else {
      // Try to break after Chinese punctuation
      let punctIdx = -1;
      for (let i = Math.min(maxWidth, remaining.length) - 1; i >= Math.floor(maxWidth * 0.3); i--) {
        if (CJK_PUNCTUATION.includes(remaining[i])) {
          punctIdx = i + 1;
          break;
        }
      }
      if (punctIdx > 0) {
        breakAt = punctIdx;
      }
      // Otherwise just break at maxWidth
    }
    lines.push(remaining.slice(0, breakAt));
    remaining = remaining.slice(breakAt);
  }
  return lines;
}

function fillRow(text: string, width: number): string {
  if (text.length >= width) return text.slice(0, width);
  return text + ' '.repeat(width - text.length);
}

function textLine(left: string, content: string, right: string, innerWidth: number): string {
  const padded = fillRow(content, innerWidth);
  return left + padded + right;
}

export function renderDialogOverlay(state: GameState, cols: number, gridRows: number): RenderCell[][] {
  const d = state.dialog;
  if (!d.active) return [];

  const tree = getDialogById(d.treeId);
  if (!tree) return [];

  const bird = state.birds.find(b => b.id === d.birdId);
  const birdType = bird ? bird.type : 0;
  const birdDef = getBirdTypeDef(birdType);
  const birdColor = fg(BIRD_COLORS[birdType]);

  // Build content lines
  // Rendering is in game cells (each = 2 terminal cols). The box is BOX_WIDTH/2 cells wide.
  // Borders take 2 cells (left ║ + right ║), so displayable content = BOX_WIDTH/2 - 2 chars.
  const innerWidth = BOX_WIDTH / 2 - 2;
  const contentLines: { text: string; color?: string }[] = [];

  // Bird name header
  contentLines.push({ text: '' });
  contentLines.push({ text: `  ${birdDef.hanzi} ${birdDef.name}`, color: birdColor });
  contentLines.push({ text: '' });

  // Bird art + speech lines side by side
  // Show bird art on lines 3-6
  const artLines = bird ? getBirdArt(state, bird) : birdDef.art;
  const speechLines: string[] = [];

  if (d.phase === 'speech' || d.phase === 'question' || d.phase === 'result') {
    for (let i = 0; i <= Math.min(d.lineIndex, tree.lines.length - 1); i++) {
      speechLines.push(tree.lines[i].text);
    }
    // On question/result phase, show all speech lines
    if (d.phase !== 'speech') {
      for (let i = d.lineIndex + 1; i < tree.lines.length; i++) {
        speechLines.push(tree.lines[i].text);
      }
    }
  }

  // Wrap speech lines, then combine with art
  const wrappedSpeech: string[] = [];
  const speechMaxWidth = innerWidth - 12; // 12 = indent + art padding
  for (const s of speechLines) {
    wrappedSpeech.push(...wrapText(s, speechMaxWidth));
  }

  // Combine art and speech
  const maxArtSpeech = Math.max(artLines.length, wrappedSpeech.length);
  for (let i = 0; i < maxArtSpeech; i++) {
    const artPart = (i < artLines.length ? artLines[i] : '').padEnd(10);
    const speechPart = i < wrappedSpeech.length ? wrappedSpeech[i] : '';
    const combined = `${artPart}${speechPart}`;
    contentLines.push({ text: '  ' + combined, color: i < artLines.length ? birdColor : undefined });
  }

  contentLines.push({ text: '' });

  // Question phase
  if (d.phase === 'question' || d.phase === 'result') {
    contentLines.push({ text: '  ' + '─'.repeat(innerWidth - 4) });
    const questionMaxWidth = innerWidth - 4;
    for (const ql of wrapText(tree.question.text, questionMaxWidth)) {
      contentLines.push({ text: '  ' + ql });
    }
    contentLines.push({ text: '' });

    for (let i = 0; i < tree.options.length; i++) {
      const opt = tree.options[i];
      const marker = d.phase === 'result'
        ? (d.selectedOption === i
          ? (opt.isCorrect ? ' ✓' : ' ✗')
          : '  ')
        : '  ';
      // Build option text: show Chinese (pinyin) if present, otherwise just English
      let optText: string;
      if (opt.text) {
        optText = `${opt.text} (${opt.pinyin})`;
      } else if (opt.english) {
        optText = opt.english;
      } else {
        optText = opt.pinyin;
      }
      const wrappedOpt = wrapText(optText, questionMaxWidth - 8);
      for (let j = 0; j < wrappedOpt.length; j++) {
        if (j === 0) {
          contentLines.push({ text: `  [${i + 1}]${marker} ${wrappedOpt[j]}` });
        } else {
          contentLines.push({ text: `        ${wrappedOpt[j]}` });
        }
      }
    }
  }

  // Result phase
  if (d.phase === 'result') {
    contentLines.push({ text: '' });
    if (d.answeredCorrectly) {
      const followupMaxWidth = innerWidth - 4;
      for (const fl of wrapText(tree.followup.text, followupMaxWidth)) {
        contentLines.push({ text: '  ' + fl });
      }
      if (d.seedAwarded) {
        const species = getSpecies(d.seedAwarded);
        const seedName = species ? `${species.hanzi} ${species.name}` : d.seedAwarded;
        contentLines.push({ text: `  +1 seed: ${seedName}` });
      }
    } else {
      contentLines.push({ text: '  不对！下次再试试吧。' });
    }
  }

  contentLines.push({ text: '' });

  // Bottom hint
  if (d.phase === 'speech') {
    contentLines.push({ text: '  [Space to continue]' });
  } else if (d.phase === 'question') {
    contentLines.push({ text: '  [Press 1/2/3 to answer]' });
  } else {
    contentLines.push({ text: '  [Space or Esc to close]' });
  }

  // Trim from top if content exceeds available space, so question/options stay visible
  const maxContentRows = gridRows - 2; // 2 for top/bottom borders
  let visibleContent = contentLines;
  if (contentLines.length > maxContentRows) {
    visibleContent = contentLines.slice(contentLines.length - maxContentRows);
  }

  // Now render into the grid overlay
  const totalHeight = Math.min(visibleContent.length + 2, gridRows); // +2 for top/bottom borders
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

      // Top border
      if (lineIdx === 0) {
        let borderChar = ' ';
        if (charIdx === 0) borderChar = '╔';
        else if (charIdx === BOX_WIDTH / 2 - 1) borderChar = '╗';
        else borderChar = '═';
        row.push({ char: borderChar, fg: HELP.fg, bg: HELP.bg, style: '' });
        continue;
      }

      // Bottom border
      if (lineIdx === totalHeight - 1) {
        let borderChar = ' ';
        if (charIdx === 0) borderChar = '╚';
        else if (charIdx === BOX_WIDTH / 2 - 1) borderChar = '╝';
        else borderChar = '═';
        row.push({ char: borderChar, fg: HELP.fg, bg: HELP.bg, style: '' });
        continue;
      }

      // Content lines
      const contentIdx = lineIdx - 1;
      if (contentIdx >= 0 && contentIdx < visibleContent.length) {
        const line = visibleContent[contentIdx];
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
        // Empty content row
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
