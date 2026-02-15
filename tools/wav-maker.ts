#!/usr/bin/env npx tsx
// WAV Maker — browse, play, tweak, and save sound parameters
import { spawn, execSync, type ChildProcess } from 'child_process';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { fileURLToPath } from 'url';
import * as path from 'path';
import { generateSound } from '../src/audio/soundGen.js';
import { SOUND_PARAMS, SOUND_CATEGORIES, type SoundName, type SoundCategory } from '../src/audio/soundParams.js';
import {
  enterAltBuffer, exitAltBuffer, hideCursor, showCursor,
  clearScreen, moveTo, reset, bold, dim, fg, clearLine,
} from '../src/terminal/ansi.js';

// ── State ───────────────────────────────────────────────────────────

type View = 'browse' | 'edit';

// Deep copy params so we can mutate freely
const params: Record<SoundName, Record<string, number>> = JSON.parse(JSON.stringify(SOUND_PARAMS));

// Build flat list of sounds with category info for browse view
interface BrowseEntry {
  name: SoundName;
  category: SoundCategory;
  categoryHeader: boolean; // true for first entry in category
}

function buildBrowseList(): BrowseEntry[] {
  const list: BrowseEntry[] = [];
  for (const cat of ['ambient', 'chirp', 'sfx'] as SoundCategory[]) {
    const names = SOUND_CATEGORIES[cat];
    names.forEach((name, i) => {
      list.push({ name, category: cat, categoryHeader: i === 0 });
    });
  }
  return list;
}

const browseList = buildBrowseList();

let view: View = 'browse';
let browseIdx = 0;
let editSound: SoundName = 'day_clear';
let editIdx = 0;
let editScroll = 0;
let playProc: ChildProcess | null = null;
const tmpDir = `/tmp/wav-maker-${process.pid}`;

// ── Helpers ─────────────────────────────────────────────────────────

function getTermSize(): { rows: number; cols: number } {
  return { rows: process.stdout.rows || 24, cols: process.stdout.columns || 80 };
}

function formatDuration(p: Record<string, number>): string {
  if (p.duration !== undefined) {
    return p.duration >= 1 ? `${p.duration.toFixed(1)}s` : `${(p.duration * 1000).toFixed(0)}ms`;
  }
  // Compute from note durations (robin/sparrow)
  let total = 0;
  for (const [k, v] of Object.entries(p)) {
    if (k.endsWith('Dur') || k === 'gap') total += v;
  }
  return `${(total * 1000).toFixed(0)}ms`;
}

function stepSize(value: number): number {
  if (value === 0) return 0.001;
  const mag = Math.floor(Math.log10(Math.abs(value)));
  return Math.max(0.001, Math.pow(10, mag) / 10);
}

function killPlay(): void {
  if (playProc) {
    try { playProc.kill(); } catch { /* ignore */ }
    playProc = null;
  }
}

function playSound(name: SoundName, customParams?: Record<string, number>): void {
  killPlay();
  const p = customParams ?? params[name];

  // For long ambient sounds, create a short preview
  let previewParams = p;
  if (p.duration !== undefined && p.duration > 2) {
    previewParams = { ...p, duration: 2, fadeOut: Math.min(p.fadeOut ?? 0.5, 0.5) };
  }

  try {
    const wav = generateSound(name, previewParams);
    const wavPath = `${tmpDir}/preview.wav`;
    writeFileSync(wavPath, wav);
    playProc = spawn('afplay', [wavPath], { stdio: 'ignore' });
    playProc.on('error', () => { playProc = null; });
    playProc.on('exit', () => { playProc = null; });
  } catch {
    // ignore playback errors
  }
}

// ── Rendering ───────────────────────────────────────────────────────

function write(s: string): void {
  process.stdout.write(s);
}

function renderBrowse(): void {
  const { rows, cols } = getTermSize();
  const w = Math.min(cols, 60);
  const line = '\u2500'.repeat(w);

  write(clearScreen + moveTo(0, 0));

  // Header
  const title = `${bold}  WAV Maker${reset}`;
  const quit = `${dim}q quit${reset}`;
  write(`${title}${' '.repeat(Math.max(2, w - 20))}${quit}\n`);
  write(`  ${dim}${line}${reset}\n`);

  let row = 2;
  for (let i = 0; i < browseList.length && row < rows - 2; i++) {
    const entry = browseList[i];

    // Category header
    if (entry.categoryHeader) {
      write(`  ${bold}${entry.category.toUpperCase()}${reset}\n`);
      row++;
      if (row >= rows - 2) break;
    }

    const selected = i === browseIdx;
    const marker = selected ? `${fg(3)}\u25b8${reset}` : ' ';
    const nameStr = entry.name.padEnd(18);
    const dur = formatDuration(params[entry.name]);
    const paramCount = Object.keys(params[entry.name]).length;
    const info = `${dim}${dur.padStart(7)}  ${String(paramCount).padStart(3)} params${reset}`;

    if (selected) {
      write(`  ${marker} ${bold}${nameStr}${reset} ${info}\n`);
    } else {
      write(`  ${marker} ${nameStr} ${info}\n`);
    }
    row++;
  }

  // Footer
  write(moveTo(rows - 1, 0));
  write(`  ${dim}\u2191/\u2193 navigate  space play  enter edit  q quit${reset}`);
}

function renderEdit(): void {
  const { rows, cols } = getTermSize();
  const w = Math.min(cols, 60);
  const line = '\u2500'.repeat(w);
  const keys = Object.keys(params[editSound]);
  const maxVisible = rows - 5; // header(2) + footer(2) + gap(1)

  // Scroll to keep selected visible
  if (editIdx < editScroll) editScroll = editIdx;
  if (editIdx >= editScroll + maxVisible) editScroll = editIdx - maxVisible + 1;

  write(clearScreen + moveTo(0, 0));

  // Header
  const title = `${bold}  ${editSound}${reset}`;
  const hint = `${dim}esc back  s save${reset}`;
  write(`${title}${' '.repeat(Math.max(2, w - editSound.length - 20))}${hint}\n`);
  write(`  ${dim}${line}${reset}\n`);

  const end = Math.min(editScroll + maxVisible, keys.length);
  for (let i = editScroll; i < end; i++) {
    const key = keys[i];
    const val = params[editSound][key];
    const selected = i === editIdx;
    const marker = selected ? `${fg(3)}\u25b8${reset}` : ' ';
    const valStr = formatValue(val);

    if (selected) {
      write(`  ${marker} ${bold}${key.padEnd(18)}${reset} ${fg(6)}${valStr.padStart(12)}${reset}\n`);
    } else {
      write(`  ${marker} ${key.padEnd(18)} ${valStr.padStart(12)}\n`);
    }
  }

  // Scroll indicator
  if (keys.length > maxVisible) {
    const pct = Math.round((editScroll / (keys.length - maxVisible)) * 100);
    write(`\n  ${dim}[${pct}%]${reset}`);
  }

  // Footer
  write(moveTo(rows - 1, 0));
  write(`  ${dim}\u2191/\u2193 param  \u2190/\u2192 adjust  shift fine  space play  s save${reset}`);
}

function formatValue(v: number): string {
  if (Number.isInteger(v) && Math.abs(v) >= 10) return v.toFixed(0);
  if (Math.abs(v) >= 1) return v.toFixed(1);
  return v.toFixed(3);
}

function render(): void {
  if (view === 'browse') renderBrowse();
  else renderEdit();
}

// ── Save ────────────────────────────────────────────────────────────

function saveParams(): void {
  const thisFile = fileURLToPath(import.meta.url);
  const paramsPath = path.resolve(path.dirname(thisFile), '..', 'src', 'audio', 'soundParams.ts');

  let src = '// Auto-generated by tools/wav-maker.ts \u2014 do not edit by hand\n\n';

  // Type unions
  src += "export type SoundName =\n";
  const allNames = Object.keys(params) as SoundName[];
  src += allNames.map((n, i) => `  ${i === 0 ? '' : '| '}'${n}'`).join('\n');
  src += ';\n\n';

  src += "export type SoundCategory = 'ambient' | 'chirp' | 'sfx';\n\n";

  // Categories
  src += 'export const SOUND_CATEGORIES: Record<SoundCategory, SoundName[]> = {\n';
  for (const cat of ['ambient', 'chirp', 'sfx'] as SoundCategory[]) {
    const names = SOUND_CATEGORIES[cat];
    src += `  ${cat}: [\n`;
    for (const n of names) {
      src += `    '${n}',\n`;
    }
    src += '  ],\n';
  }
  src += '};\n\n';

  // Params
  src += 'export const SOUND_PARAMS: Record<SoundName, Record<string, number>> = {\n';
  for (const name of allNames) {
    src += `  ${name}: {\n`;
    for (const [k, v] of Object.entries(params[name])) {
      src += `    ${k}: ${v},\n`;
    }
    src += '  },\n';
  }
  src += '};\n';

  writeFileSync(paramsPath, src);

  // Flash save indicator
  const { rows } = getTermSize();
  write(moveTo(rows - 1, 0) + clearLine);
  write(`  ${fg(2)}${bold}Saved!${reset} ${dim}${paramsPath}${reset}`);
  setTimeout(render, 800);
}

// ── Input ───────────────────────────────────────────────────────────

function handleBrowseKey(key: Buffer): void {
  const s = key.toString();

  if (s === 'q') {
    cleanup();
    return;
  }

  // Arrow keys
  if (s === '\x1b[A' || s === 'k') {
    browseIdx = Math.max(0, browseIdx - 1);
    render();
  } else if (s === '\x1b[B' || s === 'j') {
    browseIdx = Math.min(browseList.length - 1, browseIdx + 1);
    render();
  } else if (s === ' ') {
    playSound(browseList[browseIdx].name);
  } else if (s === '\r' || s === '\n') {
    editSound = browseList[browseIdx].name;
    editIdx = 0;
    editScroll = 0;
    view = 'edit';
    render();
  }
}

function handleEditKey(key: Buffer): void {
  const s = key.toString();
  const keys = Object.keys(params[editSound]);

  if (s === '\x1b' || s === '\x1b\x1b') {
    view = 'browse';
    render();
    return;
  }

  if (s === 'q') {
    cleanup();
    return;
  }

  if (s === '\x1b[A' || s === 'k') {
    editIdx = Math.max(0, editIdx - 1);
    render();
  } else if (s === '\x1b[B' || s === 'j') {
    editIdx = Math.min(keys.length - 1, editIdx + 1);
    render();
  } else if (s === '\x1b[D' || s === 'h' || s === '\x1b[C' || s === 'l') {
    // Coarse adjust
    const paramKey = keys[editIdx];
    const val = params[editSound][paramKey];
    const step = stepSize(val);
    const dir = (s === '\x1b[D' || s === 'h') ? -1 : 1;
    params[editSound][paramKey] = Math.round((val + step * dir) * 10000) / 10000;
    render();
    playSound(editSound);
  } else if (s === 'H' || s === 'L') {
    // Fine adjust (1/10 step)
    const paramKey = keys[editIdx];
    const val = params[editSound][paramKey];
    const step = stepSize(val) / 10;
    const dir = s === 'H' ? -1 : 1;
    params[editSound][paramKey] = Math.round((val + step * dir) * 100000) / 100000;
    render();
    playSound(editSound);
  } else if (s === ' ') {
    playSound(editSound);
  } else if (s === 's') {
    saveParams();
  }
}

// ── Main ────────────────────────────────────────────────────────────

function cleanup(): void {
  killPlay();
  try { rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
  write(exitAltBuffer + showCursor);
  process.stdin.setRawMode(false);
  process.exit(0);
}

function main(): void {
  mkdirSync(tmpDir, { recursive: true });

  write(enterAltBuffer + hideCursor);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding(undefined as unknown as BufferEncoding);

  render();

  process.stdin.on('data', (data: Buffer) => {
    if (view === 'browse') handleBrowseKey(data);
    else handleEditKey(data);
  });

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.stdout.on('resize', render);
}

main();
