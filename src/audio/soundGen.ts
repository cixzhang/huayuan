// Procedural WAV generation engine — pure math, zero dependencies
import { SOUND_PARAMS, type SoundName } from './soundParams.js';

const SAMPLE_RATE = 44100;

// ── Primitives ──────────────────────────────────────────────────────

export function sine(freq: number, duration: number, amp = 1.0): Float64Array {
  const len = Math.floor(SAMPLE_RATE * duration);
  const out = new Float64Array(len);
  for (let i = 0; i < len; i++) {
    out[i] = amp * Math.sin(2 * Math.PI * freq * i / SAMPLE_RATE);
  }
  return out;
}

export function fmSine(
  carrierFreq: number, modFreq: number, modDepth: number,
  duration: number, amp = 1.0,
): Float64Array {
  const len = Math.floor(SAMPLE_RATE * duration);
  const out = new Float64Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    const mod = modDepth * Math.sin(2 * Math.PI * modFreq * t);
    out[i] = amp * Math.sin(2 * Math.PI * (carrierFreq + mod) * t);
  }
  return out;
}

export function noise(duration: number, amp = 1.0): Float64Array {
  const len = Math.floor(SAMPLE_RATE * duration);
  const out = new Float64Array(len);
  for (let i = 0; i < len; i++) {
    out[i] = amp * (Math.random() * 2 - 1);
  }
  return out;
}

export function envelope(
  samples: Float64Array,
  attack: number, decay: number, sustain: number, release: number,
): Float64Array {
  const out = new Float64Array(samples.length);
  const a = Math.floor(attack * SAMPLE_RATE);
  const d = Math.floor(decay * SAMPLE_RATE);
  const r = Math.floor(release * SAMPLE_RATE);
  const rStart = samples.length - r;
  for (let i = 0; i < samples.length; i++) {
    let gain: number;
    if (i < a) gain = i / a;
    else if (i < a + d) gain = 1 - (1 - sustain) * ((i - a) / d);
    else if (i < rStart) gain = sustain;
    else gain = sustain * (1 - (i - rStart) / r);
    out[i] = samples[i] * gain;
  }
  return out;
}

export function mix(...arrays: Float64Array[]): Float64Array {
  const maxLen = Math.max(...arrays.map(a => a.length));
  const out = new Float64Array(maxLen);
  for (const arr of arrays) {
    for (let i = 0; i < arr.length; i++) {
      out[i] += arr[i];
    }
  }
  // Normalize if clipping
  let peak = 0;
  for (let i = 0; i < out.length; i++) {
    const abs = Math.abs(out[i]);
    if (abs > peak) peak = abs;
  }
  if (peak > 1) {
    for (let i = 0; i < out.length; i++) out[i] /= peak;
  }
  return out;
}

export function fade(samples: Float64Array, fadeIn: number, fadeOut: number): Float64Array {
  const out = new Float64Array(samples);
  const fiSamples = Math.floor(fadeIn * SAMPLE_RATE);
  const foSamples = Math.floor(fadeOut * SAMPLE_RATE);
  for (let i = 0; i < fiSamples && i < out.length; i++) {
    out[i] *= i / fiSamples;
  }
  for (let i = 0; i < foSamples && i < out.length; i++) {
    out[out.length - 1 - i] *= i / foSamples;
  }
  return out;
}

// ── WAV encoder ─────────────────────────────────────────────────────

export function encodeWav(samples: Float64Array): Buffer {
  const numSamples = samples.length;
  const dataSize = numSamples * 2; // 16-bit = 2 bytes per sample
  const buf = Buffer.alloc(44 + dataSize);

  // RIFF header
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8);

  // fmt chunk
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);       // chunk size
  buf.writeUInt16LE(1, 20);        // PCM
  buf.writeUInt16LE(1, 22);        // mono
  buf.writeUInt32LE(SAMPLE_RATE, 24);
  buf.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
  buf.writeUInt16LE(2, 32);        // block align
  buf.writeUInt16LE(16, 34);       // bits per sample

  // data chunk
  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.floor(s * 32767), 44 + i * 2);
  }

  return buf;
}

// ── Ambient generators (8-10s, built-in fade in/out) ─────────────

export function generateAmbientDayClear(p: Record<string, number> = SOUND_PARAMS.day_clear): Buffer {
  const dur = p.duration;
  const s1 = sine(p.tone1Freq, dur, p.tone1Amp);
  const s2 = sine(p.tone2Freq, dur, p.tone2Amp);
  // Slow amp modulation
  const combined = new Float64Array(s1.length);
  for (let i = 0; i < s1.length; i++) {
    const t = i / SAMPLE_RATE;
    const mod = p.lfoMin + p.lfoMax * Math.sin(2 * Math.PI * p.lfoFreq * t);
    combined[i] = (s1[i] + s2[i]) * mod;
  }
  return encodeWav(fade(combined, p.fadeIn, p.fadeOut));
}

export function generateAmbientDayRain(p: Record<string, number> = SOUND_PARAMS.day_rain): Buffer {
  const dur = p.duration;
  const n = noise(dur, p.noiseAmp);
  // Simple low-pass by averaging adjacent samples
  const filtered = new Float64Array(n.length);
  for (let i = 1; i < n.length; i++) {
    filtered[i] = n[i] * p.lpNew + filtered[i - 1] * p.lpPrev;
  }
  // Random drip pings
  const pings = new Float64Array(n.length);
  for (let pi = 0; pi < p.pingCount; pi++) {
    const start = Math.floor(Math.random() * (n.length - 2000));
    const freq = p.pingFreqMin + Math.random() * p.pingFreqMax;
    for (let i = 0; i < 2000; i++) {
      const env = Math.exp(-i / p.pingDecay);
      pings[start + i] += p.pingAmp * env * Math.sin(2 * Math.PI * freq * i / SAMPLE_RATE);
    }
  }
  return encodeWav(fade(mix(filtered, pings), p.fadeIn, p.fadeOut));
}

export function generateAmbientDayWind(p: Record<string, number> = SOUND_PARAMS.day_wind): Buffer {
  const dur = p.duration;
  const n = noise(dur, p.noiseAmp);
  const out = new Float64Array(n.length);
  for (let i = 0; i < n.length; i++) {
    const t = i / SAMPLE_RATE;
    const lfo = p.lfoMin + p.lfoMax * Math.sin(2 * Math.PI * p.lfoFreq * t);
    out[i] = n[i] * lfo;
  }
  // Low-pass
  for (let i = 1; i < out.length; i++) {
    out[i] = out[i] * p.lpNew + out[i - 1] * p.lpPrev;
  }
  return encodeWav(fade(out, p.fadeIn, p.fadeOut));
}

export function generateAmbientDayCloudy(p: Record<string, number> = SOUND_PARAMS.day_cloudy): Buffer {
  const dur = p.duration;
  const s1 = sine(p.tone1Freq, dur, p.tone1Amp);
  const s2 = sine(p.tone2Freq, dur, p.tone2Amp);
  const combined = new Float64Array(s1.length);
  for (let i = 0; i < s1.length; i++) {
    const t = i / SAMPLE_RATE;
    const mod = p.lfoMin + p.lfoMax * Math.sin(2 * Math.PI * p.lfoFreq * t);
    combined[i] = (s1[i] + s2[i]) * mod;
  }
  return encodeWav(fade(combined, p.fadeIn, p.fadeOut));
}

export function generateAmbientNightClear(p: Record<string, number> = SOUND_PARAMS.night_clear): Buffer {
  const dur = p.duration;
  const out = new Float64Array(Math.floor(SAMPLE_RATE * dur));
  // Cricket chorus: short bursts
  const burstInterval = Math.floor(SAMPLE_RATE * p.burstInterval);
  for (let pos = 0; pos < out.length; pos += burstInterval + Math.floor(Math.random() * SAMPLE_RATE * p.burstIntervalRand)) {
    const freq = p.freqMin + Math.random() * p.freqMax;
    const burstLen = Math.floor(SAMPLE_RATE * (p.burstDurMin + Math.random() * p.burstDurMax));
    for (let i = 0; i < burstLen && pos + i < out.length; i++) {
      const env = Math.sin(Math.PI * i / burstLen);
      out[pos + i] += p.amp * env * Math.sin(2 * Math.PI * freq * i / SAMPLE_RATE);
    }
  }
  return encodeWav(fade(out, p.fadeIn, p.fadeOut));
}

export function generateAmbientNightRain(p: Record<string, number> = SOUND_PARAMS.night_rain): Buffer {
  const dur = p.duration;
  const rain = noise(dur, p.noiseAmp);
  // Low-pass
  for (let i = 1; i < rain.length; i++) {
    rain[i] = rain[i] * p.lpNew + rain[i - 1] * p.lpPrev;
  }
  // Quieter crickets
  const crickets = new Float64Array(rain.length);
  const burstInterval = Math.floor(SAMPLE_RATE * p.cricketInterval);
  for (let pos = 0; pos < crickets.length; pos += burstInterval + Math.floor(Math.random() * SAMPLE_RATE * p.cricketIntervalRand)) {
    const freq = p.cricketFreqMin + Math.random() * p.cricketFreqMax;
    const burstLen = Math.floor(SAMPLE_RATE * p.cricketBurstDur);
    for (let i = 0; i < burstLen && pos + i < crickets.length; i++) {
      const env = Math.sin(Math.PI * i / burstLen);
      crickets[pos + i] += p.cricketAmp * env * Math.sin(2 * Math.PI * freq * i / SAMPLE_RATE);
    }
  }
  return encodeWav(fade(mix(rain, crickets), p.fadeIn, p.fadeOut));
}

export function generateAmbientNightWind(p: Record<string, number> = SOUND_PARAMS.night_wind): Buffer {
  const dur = p.duration;
  const n = noise(dur, p.noiseAmp);
  const out = new Float64Array(n.length);
  for (let i = 0; i < n.length; i++) {
    const t = i / SAMPLE_RATE;
    const lfo = p.lfoMin + p.lfoMax * Math.sin(2 * Math.PI * p.lfoFreq * t);
    out[i] = n[i] * lfo;
  }
  // Heavier low-pass for lower pitch
  for (let i = 1; i < out.length; i++) {
    out[i] = out[i] * p.lpNew + out[i - 1] * p.lpPrev;
  }
  // Distant cricket
  const crickets = new Float64Array(out.length);
  const burstInterval = Math.floor(SAMPLE_RATE * p.cricketInterval);
  for (let pos = 0; pos < crickets.length; pos += burstInterval + Math.floor(Math.random() * SAMPLE_RATE * p.cricketIntervalRand)) {
    const freq = p.cricketFreqMin + Math.random() * p.cricketFreqMax;
    const burstLen = Math.floor(SAMPLE_RATE * p.cricketBurstDur);
    for (let i = 0; i < burstLen && pos + i < crickets.length; i++) {
      const env = Math.sin(Math.PI * i / burstLen);
      crickets[pos + i] += p.cricketAmp * env * Math.sin(2 * Math.PI * freq * i / SAMPLE_RATE);
    }
  }
  return encodeWav(fade(mix(out, crickets), p.fadeIn, p.fadeOut));
}

export function generateAmbientNightCloudy(p: Record<string, number> = SOUND_PARAMS.night_cloudy): Buffer {
  const dur = p.duration;
  // Near-silence with faint drone
  const drone = sine(p.droneFreq, dur, p.droneAmp);
  const faintNoise = noise(dur, p.noiseAmp);
  return encodeWav(fade(mix(drone, faintNoise), p.fadeIn, p.fadeOut));
}

// ── Bird chirps (100-300ms) ─────────────────────────────────────────

export function generateRobinChirp(p: Record<string, number> = SOUND_PARAMS.robin): Buffer {
  // 3-note descending trill
  const n1 = envelope(sine(p.note1Freq, p.note1Dur, p.note1Amp), p.note1A, p.note1D, p.note1S, p.note1R);
  const n2 = envelope(sine(p.note2Freq, p.note2Dur, p.note2Amp), p.note2A, p.note2D, p.note2S, p.note2R);
  const n3 = envelope(sine(p.note3Freq, p.note3Dur, p.note3Amp), p.note3A, p.note3D, p.note3S, p.note3R);
  const total = n1.length + n2.length + n3.length;
  const out = new Float64Array(total);
  out.set(n1, 0);
  out.set(n2, n1.length);
  out.set(n3, n1.length + n2.length);
  return encodeWav(out);
}

export function generateSparrowChirp(p: Record<string, number> = SOUND_PARAMS.sparrow): Buffer {
  // Two quick chips
  const gap = Math.floor(SAMPLE_RATE * p.gap);
  const n1 = envelope(sine(p.note1Freq, p.note1Dur, p.note1Amp), p.note1A, p.note1D, p.note1S, p.note1R);
  const n2 = envelope(sine(p.note2Freq, p.note2Dur, p.note2Amp), p.note2A, p.note2D, p.note2S, p.note2R);
  const total = n1.length + gap + n2.length;
  const out = new Float64Array(total);
  out.set(n1, 0);
  out.set(n2, n1.length + gap);
  return encodeWav(out);
}

export function generateDuckQuack(p: Record<string, number> = SOUND_PARAMS.duck): Buffer {
  // Low FM noise burst
  const dur = p.duration;
  const fm = fmSine(p.carrierFreq, p.modFreq, p.modDepth, dur, p.fmAmp);
  const n = noise(dur, p.noiseAmp);
  const combined = mix(fm, n);
  return encodeWav(envelope(combined, p.attack, p.decay, p.sustain, p.release));
}

export function generateGooseHonk(p: Record<string, number> = SOUND_PARAMS.goose): Buffer {
  // Nasal brassy honk: two FM oscillators with wide modulation + noise attack
  const dur = p.duration;
  const len = Math.floor(44100 * dur);
  // Primary: FM with wide modulation depth for nasal quality
  const fm1 = fmSine(p.fm1Carrier, p.fm1ModFreq, p.fm1ModDepth, dur, p.fm1Amp);
  // Secondary harmonic at ~3:2 ratio for beating/formant effect
  const fm2 = fmSine(p.fm2Carrier, p.fm2ModFreq, p.fm2ModDepth, dur, p.fm2Amp);
  // Brief noise burst for breathy attack
  const noiseBurst = new Float64Array(len);
  const attackSamples = Math.floor(44100 * p.noiseAttackDur);
  for (let i = 0; i < attackSamples && i < len; i++) {
    noiseBurst[i] = p.noiseAmp * (Math.random() * 2 - 1) * (1 - i / attackSamples);
  }
  const combined = mix(fm1, fm2, noiseBurst);
  return encodeWav(envelope(combined, p.attack, p.decay, p.sustain, p.release));
}

// ── Action SFX (100-200ms) ──────────────────────────────────────────

export function generatePlantSfx(p: Record<string, number> = SOUND_PARAMS.plant_sfx): Buffer {
  // Sine sweep freqStart→freqEnd
  const dur = p.duration;
  const len = Math.floor(SAMPLE_RATE * dur);
  const out = new Float64Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / len;
    const freq = p.freqStart - (p.freqStart - p.freqEnd) * t;
    out[i] = p.amp * Math.sin(2 * Math.PI * freq * i / SAMPLE_RATE);
  }
  return encodeWav(envelope(out, p.attack, p.decay, p.sustain, p.release));
}

export function generateWaterSfx(p: Record<string, number> = SOUND_PARAMS.water_sfx): Buffer {
  // Noise burst + sine
  const dur = p.duration;
  const n = noise(dur, p.noiseAmp);
  // Low-pass the noise
  for (let i = 1; i < n.length; i++) {
    n[i] = n[i] * p.lpNew + n[i - 1] * p.lpPrev;
  }
  const s = sine(p.sineFreq, dur, p.sineAmp);
  return encodeWav(envelope(mix(n, s), p.attack, p.decay, p.sustain, p.release));
}

export function generateHarvestSfx(p: Record<string, number> = SOUND_PARAMS.harvest_sfx): Buffer {
  // Ding at tone1Freq + harmonic
  const dur = p.duration;
  const s1 = sine(p.tone1Freq, dur, p.tone1Amp);
  const s2 = sine(p.tone2Freq, dur, p.tone2Amp);
  return encodeWav(envelope(mix(s1, s2), p.attack, p.decay, p.sustain, p.release));
}

// ── Dispatch ────────────────────────────────────────────────────────

const GENERATORS: Record<SoundName, (p?: Record<string, number>) => Buffer> = {
  day_clear: generateAmbientDayClear,
  day_rain: generateAmbientDayRain,
  day_wind: generateAmbientDayWind,
  day_cloudy: generateAmbientDayCloudy,
  night_clear: generateAmbientNightClear,
  night_rain: generateAmbientNightRain,
  night_wind: generateAmbientNightWind,
  night_cloudy: generateAmbientNightCloudy,
  robin: generateRobinChirp,
  sparrow: generateSparrowChirp,
  duck: generateDuckQuack,
  goose: generateGooseHonk,
  plant_sfx: generatePlantSfx,
  water_sfx: generateWaterSfx,
  harvest_sfx: generateHarvestSfx,
};

export function generateSound(name: SoundName, params?: Record<string, number>): Buffer {
  return GENERATORS[name](params);
}
