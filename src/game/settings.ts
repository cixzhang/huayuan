import * as fs from 'fs';
import type { GameSettings } from '../types.js';
import { SETTINGS_FILE_PATH } from '../constants.js';

const DEFAULTS: GameSettings = {
  soundEnabled: true,
  weatherEffectsEnabled: true,
};

export function loadSettings(): GameSettings {
  try {
    const raw = fs.readFileSync(SETTINGS_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      soundEnabled: typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : DEFAULTS.soundEnabled,
      weatherEffectsEnabled: typeof parsed.weatherEffectsEnabled === 'boolean' ? parsed.weatherEffectsEnabled : DEFAULTS.weatherEffectsEnabled,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(settings: GameSettings): void {
  try {
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(settings), 'utf-8');
  } catch {
    // ignore write errors
  }
}
