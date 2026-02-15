import { spawn, type ChildProcess } from 'child_process';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import type { GameState } from '../types.js';
import { BirdType } from '../types.js';
import { WeatherType } from '../types.js';
import { AUDIO_MAX_SFX, AMBIENT_CROSSFADE_MS } from '../constants.js';
import {
  generateAmbientDayClear, generateAmbientDayRain,
  generateAmbientDayWind, generateAmbientDayCloudy,
  generateAmbientNightClear, generateAmbientNightRain,
  generateAmbientNightWind, generateAmbientNightCloudy,
  generateRobinChirp, generateSparrowChirp,
  generateDuckQuack, generateGooseHonk,
  generatePlantSfx, generateWaterSfx, generateHarvestSfx,
} from './soundGen.js';

type AmbientKey = 'day_clear' | 'day_rain' | 'day_wind' | 'day_cloudy'
                | 'night_clear' | 'night_rain' | 'night_wind' | 'night_cloudy';

const AMBIENT_GENERATORS: Record<AmbientKey, (p?: Record<string, number>) => Buffer> = {
  day_clear: generateAmbientDayClear,
  day_rain: generateAmbientDayRain,
  day_wind: generateAmbientDayWind,
  day_cloudy: generateAmbientDayCloudy,
  night_clear: generateAmbientNightClear,
  night_rain: generateAmbientNightRain,
  night_wind: generateAmbientNightWind,
  night_cloudy: generateAmbientNightCloudy,
};

const CHIRP_GENERATORS: Record<number, (p?: Record<string, number>) => Buffer> = {
  [BirdType.Robin]: generateRobinChirp,
  [BirdType.Sparrow]: generateSparrowChirp,
  [BirdType.Duck]: generateDuckQuack,
  [BirdType.Goose]: generateGooseHonk,
};

const SFX_GENERATORS: Record<string, (p?: Record<string, number>) => Buffer> = {
  plant: generatePlantSfx,
  water: generateWaterSfx,
  harvest: generateHarvestSfx,
};

export class AudioSystem {
  private enabled = true;
  private muted = false;
  private tmpDir = '';
  private wavPaths: Record<string, string> = {};

  // Ambient playback
  private currentAmbientKey: AmbientKey | null = null;
  private ambientProcess: ChildProcess | null = null;
  private fadingProcess: ChildProcess | null = null;

  // SFX tracking
  private sfxProcesses: Set<ChildProcess> = new Set();

  init(): void {
    this.tmpDir = `/tmp/huayuan-audio-${process.pid}`;
    try {
      mkdirSync(this.tmpDir, { recursive: true });
    } catch {
      this.enabled = false;
      return;
    }

    // Generate all WAV files
    for (const [key, gen] of Object.entries(AMBIENT_GENERATORS)) {
      const path = `${this.tmpDir}/${key}.wav`;
      try {
        writeFileSync(path, gen());
        this.wavPaths[key] = path;
      } catch {
        this.enabled = false;
        return;
      }
    }

    for (const [type, gen] of Object.entries(CHIRP_GENERATORS)) {
      const key = `chirp_${type}`;
      const path = `${this.tmpDir}/${key}.wav`;
      try {
        writeFileSync(path, gen());
        this.wavPaths[key] = path;
      } catch {
        this.enabled = false;
        return;
      }
    }

    for (const [name, gen] of Object.entries(SFX_GENERATORS)) {
      const path = `${this.tmpDir}/sfx_${name}.wav`;
      try {
        writeFileSync(path, gen());
        this.wavPaths[`sfx_${name}`] = path;
      } catch {
        this.enabled = false;
        return;
      }
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) {
      this.stopAmbient();
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  tick(state: GameState): void {
    if (!this.enabled || this.muted) return;

    const isNight = state.weather.nightPhase > 0.5;
    const weather = state.weather.current;

    // Determine if ambient should be silent
    const silent = !isNight && (
      weather === WeatherType.Neutral ||
      weather === WeatherType.Clear ||
      weather === WeatherType.Cloudy
    );

    if (silent) {
      // Stop ambient if playing
      if (this.currentAmbientKey !== null) {
        this.stopAmbient();
      }
      return;
    }

    // Night neutral uses night_clear (crickets)
    const resolvedWeather = (weather === WeatherType.Neutral) ? 'clear' : weather;
    const timeOfDay = isNight ? 'night' : 'day';
    const key = `${timeOfDay}_${resolvedWeather}` as AmbientKey;

    if (key !== this.currentAmbientKey) {
      this.transitionAmbient(key);
    }
  }

  playSfx(name: string): void {
    if (!this.enabled || this.muted) return;
    const path = this.wavPaths[`sfx_${name}`];
    if (!path) return;
    if (this.sfxProcesses.size >= AUDIO_MAX_SFX) return;

    const proc = this.spawnAfplay(path);
    if (!proc) return;
    this.sfxProcesses.add(proc);
    proc.on('exit', () => this.sfxProcesses.delete(proc));
  }

  cleanup(): void {
    // Kill all processes
    this.killProcess(this.ambientProcess);
    this.ambientProcess = null;
    this.killProcess(this.fadingProcess);
    this.fadingProcess = null;
    for (const proc of this.sfxProcesses) {
      this.killProcess(proc);
    }
    this.sfxProcesses.clear();

    // Remove temp dir
    if (this.tmpDir) {
      try {
        rmSync(this.tmpDir, { recursive: true, force: true });
      } catch {
        // ignore
      }
    }
  }

  private stopAmbient(): void {
    if (this.ambientProcess) {
      this.killProcess(this.ambientProcess);
      this.ambientProcess = null;
    }
    this.killProcess(this.fadingProcess);
    this.fadingProcess = null;
    this.currentAmbientKey = null;
  }

  private transitionAmbient(newKey: AmbientKey): void {
    // Move current to fading slot, kill after crossfade
    if (this.ambientProcess) {
      this.killProcess(this.fadingProcess); // kill any already-fading process
      this.fadingProcess = this.ambientProcess;
      this.ambientProcess = null;

      const fading = this.fadingProcess;
      setTimeout(() => {
        if (fading === this.fadingProcess) {
          this.killProcess(fading);
          this.fadingProcess = null;
        }
      }, AMBIENT_CROSSFADE_MS);
    }

    this.currentAmbientKey = newKey;
    this.startAmbientLoop(newKey);
  }

  private startAmbientLoop(key: AmbientKey): void {
    const path = this.wavPaths[key];
    if (!path) return;

    const proc = this.spawnAfplay(path);
    if (!proc) return;
    this.ambientProcess = proc;

    proc.on('exit', () => {
      // Respawn if still current key
      if (this.currentAmbientKey === key && this.ambientProcess === proc && this.enabled) {
        this.startAmbientLoop(key);
      }
    });
  }

  playChirp(birdType: BirdType): void {
    if (!this.enabled || this.muted) return;
    const path = this.wavPaths[`chirp_${birdType}`];
    if (!path) return;
    if (this.sfxProcesses.size >= AUDIO_MAX_SFX) return;

    const proc = this.spawnAfplay(path);
    if (!proc) return;
    this.sfxProcesses.add(proc);
    proc.on('exit', () => this.sfxProcesses.delete(proc));
  }

  private spawnAfplay(path: string): ChildProcess | null {
    try {
      const proc = spawn('afplay', [path], { stdio: 'ignore' });
      proc.on('error', () => {
        this.enabled = false;
      });
      return proc;
    } catch {
      this.enabled = false;
      return null;
    }
  }

  private killProcess(proc: ChildProcess | null): void {
    if (!proc) return;
    try {
      proc.kill();
    } catch {
      // ignore
    }
  }
}
