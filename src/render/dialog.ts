import type { GameState, RenderCell } from '../types.js';
import { getDialogById, getBirdTypeDef } from '../data/birds.js';
import { getSpecies } from '../data/plants.js';
import { HELP } from './palette.js';
import { fg } from '../terminal/ansi.js';
import { BIRD_COLORS } from './palette.js';

const BOX_WIDTH = 52;  // characters wide
const BOX_HEIGHT = 20; // rows tall

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
  const innerWidth = BOX_WIDTH - 4; // minus borders + padding
  const contentLines: { text: string; color?: string }[] = [];

  // Bird name header
  contentLines.push({ text: '' });
  contentLines.push({ text: `  ${birdDef.hanzi} ${birdDef.name}`, color: birdColor });
  contentLines.push({ text: '' });

  // Bird art + speech lines side by side
  // Show bird art on lines 3-6
  const artLines = birdDef.art;
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

  // Combine art and speech
  const maxArtSpeech = Math.max(artLines.length, speechLines.length);
  for (let i = 0; i < maxArtSpeech; i++) {
    const artPart = (i < artLines.length ? artLines[i] : '').padEnd(10);
    const speechPart = i < speechLines.length ? speechLines[i] : '';
    const combined = `${artPart}${speechPart}`;
    contentLines.push({ text: '  ' + combined, color: i < artLines.length ? birdColor : undefined });
  }

  contentLines.push({ text: '' });

  // Question phase
  if (d.phase === 'question' || d.phase === 'result') {
    contentLines.push({ text: '  ' + '─'.repeat(innerWidth - 4) });
    contentLines.push({ text: '  ' + tree.question.text });
    contentLines.push({ text: '' });

    for (let i = 0; i < tree.options.length; i++) {
      const opt = tree.options[i];
      const marker = d.phase === 'result'
        ? (d.selectedOption === i
          ? (opt.isCorrect ? ' ✓' : ' ✗')
          : '  ')
        : '  ';
      contentLines.push({
        text: `  [${i + 1}]${marker} ${opt.text} (${opt.pinyin})`,
      });
    }
  }

  // Result phase
  if (d.phase === 'result') {
    contentLines.push({ text: '' });
    if (d.answeredCorrectly) {
      contentLines.push({ text: '  ' + tree.followup.text });
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

  // Now render into the grid overlay
  const totalHeight = Math.min(contentLines.length + 2, gridRows); // +2 for top/bottom borders
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
