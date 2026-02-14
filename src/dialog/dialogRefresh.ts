import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODEL_IDS: Record<string, string> = {
  haiku: 'claude-haiku-4-5-20251001',
  sonnet: 'claude-sonnet-4-5-20250929',
  opus: 'claude-opus-4-6',
};

const GENERATED_PATH = path.resolve(__dirname, '../data/dialog-generated.json');

function ask(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

function buildSystemPrompt(hskLevel: number, topics: string): string {
  // Read dialog guidelines
  const guidelinesPath = path.resolve(__dirname, '../../docs/dialog-guidelines.md');
  const guidelines = fs.readFileSync(guidelinesPath, 'utf-8');

  return `You are a dialog writer for a Chinese-language learning garden game where birds quiz the player.

## Dialog Guidelines
${guidelines}

## TypeScript Types

\`\`\`typescript
type SeedRewardType =
  | 'random_base' | 'random_hybrid'
  | 'grass' | 'flower' | 'tree'
  | 'lotus' | 'cactus' | 'moss'
  | 'cha' | 'zhu' | 'maple'
  | 'fang' | 'miao' | 'guo' | 'tao' | 'ju' | 'mei' | 'lan';

enum WeatherType {
  Neutral = 'neutral',
  Clear = 'clear',
  Cloudy = 'cloudy',
  Rain = 'rain',
  Wind = 'wind',
}

interface DialogOption {
  text: string;
  pinyin: string;
  english: string;
  isCorrect: boolean;
}

interface DialogTree {
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
\`\`\`

## WeatherType values for conditions
Use these string values: "neutral", "clear", "cloudy", "rain", "wind"

## Instructions
- Generate exactly 10 DialogTree objects as a JSON array
- Target HSK level ${hskLevel} vocabulary
- Prefix all IDs with "gen_" followed by an index (gen_0, gen_1, ... gen_9)
- Include pinyin on all Chinese text
- Each dialog must have exactly 3 answer options, one correct
- Vary question types (meaning, antonym, fill-in, situational)
- Vary conditions (some with weather, some with isNight, some with plant counts, some unconditional)
- Keep speech lines under 24 characters
${topics ? `- Incorporate these topics where natural: ${topics}` : ''}

Output ONLY a JSON array of 10 DialogTree objects. No explanation, no markdown fences.`;
}

function extractJson(text: string): string {
  // Try to extract from markdown code fence
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch) return fenceMatch[1].trim();
  // Otherwise use the raw text
  return text.trim();
}

export function getGeneratedDialogCount(): number {
  try {
    const data = JSON.parse(fs.readFileSync(GENERATED_PATH, 'utf-8'));
    if (data.dialogs && Array.isArray(data.dialogs)) {
      return data.dialogs.length;
    }
  } catch {
    // File doesn't exist
  }
  return 0;
}

export function restoreDefaultDialog(): void {
  try {
    fs.unlinkSync(GENERATED_PATH);
  } catch {
    // File didn't exist
  }
}

export async function generateDialog(mode: 'add' | 'replace'): Promise<void> {
  const apiKey = process.env['ANTHROPIC_API_KEY'];
  if (!apiKey) {
    console.log('Set ANTHROPIC_API_KEY to enable dialog generation.');
    return;
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  try {
    const hskInput = await ask(rl, 'HSK level (1-6, default 3): ');
    const hskLevel = Math.max(1, Math.min(6, parseInt(hskInput) || 3));

    const topics = await ask(rl, 'Topics of interest (comma-separated, or Enter to skip): ');

    const modelInput = await ask(rl, 'Model (haiku/sonnet/opus, default haiku): ');
    const modelKey = modelInput.toLowerCase();
    const modelId = MODEL_IDS[modelKey] || MODEL_IDS['haiku'];

    process.stdout.write('Generating 10 dialogs...');

    const systemPrompt = buildSystemPrompt(hskLevel, topics);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: modelId,
        max_tokens: 8192,
        system: systemPrompt,
        messages: [
          { role: 'user', content: 'Generate 10 fresh DialogTree objects as a JSON array.' },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(` error (${response.status}): ${errorText}`);
      return;
    }

    const data = await response.json() as { content: { type: string; text: string }[] };
    const textBlock = data.content.find((b) => b.type === 'text');
    if (!textBlock) {
      console.log(' error: no text in response');
      return;
    }

    const jsonStr = extractJson(textBlock.text);
    const newDialogs = JSON.parse(jsonStr) as unknown[];

    if (!Array.isArray(newDialogs) || newDialogs.length === 0) {
      console.log(' error: invalid response format');
      return;
    }

    let allDialogs: unknown[] = [];
    if (mode === 'add') {
      try {
        const existing = JSON.parse(fs.readFileSync(GENERATED_PATH, 'utf-8'));
        if (existing.dialogs && Array.isArray(existing.dialogs)) {
          allDialogs = existing.dialogs;
        }
      } catch {
        // File doesn't exist yet, start fresh
      }
    }

    allDialogs.push(...newDialogs);
    fs.writeFileSync(GENERATED_PATH, JSON.stringify({ dialogs: allDialogs }, null, 2));

    console.log(` done! (${newDialogs.length} dialogs written)`);
  } finally {
    rl.close();
  }
}
