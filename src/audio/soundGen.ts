// Procedural WAV generation engine — pure math, zero dependencies
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

// ── Ambient generators (8-10s, built-in 1s fade in/out) ─────────────

export function generateAmbientDayClear(): Buffer {
  const dur = 9;
  const s1 = sine(220, dur, 0.3);
  const s2 = sine(330, dur, 0.2);
  // Slow amp modulation
  const combined = new Float64Array(s1.length);
  for (let i = 0; i < s1.length; i++) {
    const t = i / SAMPLE_RATE;
    const mod = 0.7 + 0.3 * Math.sin(2 * Math.PI * 0.25 * t);
    combined[i] = (s1[i] + s2[i]) * mod;
  }
  return encodeWav(fade(combined, 1, 1));
}

export function generateAmbientDayRain(): Buffer {
  const dur = 10;
  const n = noise(dur, 0.25);
  // Simple low-pass by averaging adjacent samples
  const filtered = new Float64Array(n.length);
  for (let i = 1; i < n.length; i++) {
    filtered[i] = n[i] * 0.3 + filtered[i - 1] * 0.7;
  }
  // Random drip pings
  const pings = new Float64Array(n.length);
  for (let p = 0; p < 20; p++) {
    const start = Math.floor(Math.random() * (n.length - 2000));
    const freq = 800 + Math.random() * 1200;
    for (let i = 0; i < 2000; i++) {
      const env = Math.exp(-i / 400);
      pings[start + i] += 0.15 * env * Math.sin(2 * Math.PI * freq * i / SAMPLE_RATE);
    }
  }
  return encodeWav(fade(mix(filtered, pings), 1, 1));
}

export function generateAmbientDayWind(): Buffer {
  const dur = 9;
  const n = noise(dur, 0.3);
  const out = new Float64Array(n.length);
  for (let i = 0; i < n.length; i++) {
    const t = i / SAMPLE_RATE;
    const lfo = 0.4 + 0.6 * Math.sin(2 * Math.PI * 2.5 * t);
    out[i] = n[i] * lfo;
  }
  // Low-pass
  for (let i = 1; i < out.length; i++) {
    out[i] = out[i] * 0.2 + out[i - 1] * 0.8;
  }
  return encodeWav(fade(out, 1, 1));
}

export function generateAmbientDayCloudy(): Buffer {
  const dur = 9;
  const s1 = sine(220, dur, 0.15);
  const s2 = sine(330, dur, 0.1);
  const combined = new Float64Array(s1.length);
  for (let i = 0; i < s1.length; i++) {
    const t = i / SAMPLE_RATE;
    const mod = 0.6 + 0.4 * Math.sin(2 * Math.PI * 0.15 * t);
    combined[i] = (s1[i] + s2[i]) * mod;
  }
  return encodeWav(fade(combined, 1, 1));
}

export function generateAmbientNightClear(): Buffer {
  const dur = 10;
  const out = new Float64Array(Math.floor(SAMPLE_RATE * dur));
  // Cricket chorus: short bursts at 4-5kHz every 500-800ms
  const burstInterval = Math.floor(SAMPLE_RATE * 0.6);
  for (let pos = 0; pos < out.length; pos += burstInterval + Math.floor(Math.random() * SAMPLE_RATE * 0.3)) {
    const freq = 4000 + Math.random() * 1000;
    const burstLen = Math.floor(SAMPLE_RATE * (0.05 + Math.random() * 0.05));
    for (let i = 0; i < burstLen && pos + i < out.length; i++) {
      const env = Math.sin(Math.PI * i / burstLen);
      out[pos + i] += 0.2 * env * Math.sin(2 * Math.PI * freq * i / SAMPLE_RATE);
    }
  }
  return encodeWav(fade(out, 1, 1));
}

export function generateAmbientNightRain(): Buffer {
  const dur = 10;
  const rain = noise(dur, 0.2);
  // Low-pass
  for (let i = 1; i < rain.length; i++) {
    rain[i] = rain[i] * 0.3 + rain[i - 1] * 0.7;
  }
  // Quieter crickets
  const crickets = new Float64Array(rain.length);
  const burstInterval = Math.floor(SAMPLE_RATE * 0.8);
  for (let pos = 0; pos < crickets.length; pos += burstInterval + Math.floor(Math.random() * SAMPLE_RATE * 0.4)) {
    const freq = 4200 + Math.random() * 800;
    const burstLen = Math.floor(SAMPLE_RATE * 0.04);
    for (let i = 0; i < burstLen && pos + i < crickets.length; i++) {
      const env = Math.sin(Math.PI * i / burstLen);
      crickets[pos + i] += 0.08 * env * Math.sin(2 * Math.PI * freq * i / SAMPLE_RATE);
    }
  }
  return encodeWav(fade(mix(rain, crickets), 1, 1));
}

export function generateAmbientNightWind(): Buffer {
  const dur = 9;
  const n = noise(dur, 0.25);
  const out = new Float64Array(n.length);
  for (let i = 0; i < n.length; i++) {
    const t = i / SAMPLE_RATE;
    const lfo = 0.3 + 0.7 * Math.sin(2 * Math.PI * 1.5 * t);
    out[i] = n[i] * lfo;
  }
  // Heavier low-pass for lower pitch
  for (let i = 1; i < out.length; i++) {
    out[i] = out[i] * 0.15 + out[i - 1] * 0.85;
  }
  // Distant cricket
  const crickets = new Float64Array(out.length);
  const burstInterval = Math.floor(SAMPLE_RATE * 1.2);
  for (let pos = 0; pos < crickets.length; pos += burstInterval + Math.floor(Math.random() * SAMPLE_RATE * 0.5)) {
    const freq = 4500 + Math.random() * 500;
    const burstLen = Math.floor(SAMPLE_RATE * 0.03);
    for (let i = 0; i < burstLen && pos + i < crickets.length; i++) {
      const env = Math.sin(Math.PI * i / burstLen);
      crickets[pos + i] += 0.05 * env * Math.sin(2 * Math.PI * freq * i / SAMPLE_RATE);
    }
  }
  return encodeWav(fade(mix(out, crickets), 1, 1));
}

export function generateAmbientNightCloudy(): Buffer {
  const dur = 8;
  // Near-silence with faint 110Hz drone
  const drone = sine(110, dur, 0.06);
  const faintNoise = noise(dur, 0.02);
  return encodeWav(fade(mix(drone, faintNoise), 1, 1));
}

// ── Bird chirps (100-300ms) ─────────────────────────────────────────

export function generateRobinChirp(): Buffer {
  // 3-note descending trill: 2200→1800→2400Hz
  const noteLen = 0.07;
  const n1 = envelope(sine(2200, noteLen, 0.6), 0.005, 0.01, 0.8, 0.01);
  const n2 = envelope(sine(1800, noteLen, 0.5), 0.005, 0.01, 0.7, 0.01);
  const n3 = envelope(sine(2400, noteLen, 0.6), 0.005, 0.01, 0.8, 0.01);
  const total = n1.length + n2.length + n3.length;
  const out = new Float64Array(total);
  out.set(n1, 0);
  out.set(n2, n1.length);
  out.set(n3, n1.length + n2.length);
  return encodeWav(out);
}

export function generateSparrowChirp(): Buffer {
  // Two quick chips: 3000, 3200Hz
  const noteLen = 0.05;
  const gap = Math.floor(SAMPLE_RATE * 0.03);
  const n1 = envelope(sine(3000, noteLen, 0.5), 0.003, 0.01, 0.7, 0.01);
  const n2 = envelope(sine(3200, noteLen, 0.5), 0.003, 0.01, 0.7, 0.01);
  const total = n1.length + gap + n2.length;
  const out = new Float64Array(total);
  out.set(n1, 0);
  out.set(n2, n1.length + gap);
  return encodeWav(out);
}

export function generateDuckQuack(): Buffer {
  // Low FM noise burst 300-500Hz
  const dur = 0.2;
  const fm = fmSine(400, 30, 100, dur, 0.5);
  const n = noise(dur, 0.15);
  const combined = mix(fm, n);
  return encodeWav(envelope(combined, 0.01, 0.03, 0.6, 0.05));
}

export function generateGooseHonk(): Buffer {
  // Nasal brassy honk: two FM oscillators with wide modulation + noise attack
  const dur = 0.35;
  const len = Math.floor(44100 * dur);
  // Primary: FM with wide modulation depth for nasal quality
  const fm1 = fmSine(280, 12, 150, dur, 0.5);
  // Secondary harmonic at ~3:2 ratio for beating/formant effect
  const fm2 = fmSine(420, 8, 80, dur, 0.3);
  // Brief noise burst for breathy attack
  const noiseBurst = new Float64Array(len);
  const attackSamples = Math.floor(44100 * 0.04);
  for (let i = 0; i < attackSamples && i < len; i++) {
    noiseBurst[i] = 0.25 * (Math.random() * 2 - 1) * (1 - i / attackSamples);
  }
  const combined = mix(fm1, fm2, noiseBurst);
  return encodeWav(envelope(combined, 0.008, 0.05, 0.65, 0.08));
}

// ── Action SFX (100-200ms) ──────────────────────────────────────────

export function generatePlantSfx(): Buffer {
  // Sine sweep 800→200Hz
  const dur = 0.15;
  const len = Math.floor(SAMPLE_RATE * dur);
  const out = new Float64Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / len;
    const freq = 800 - 600 * t;
    out[i] = 0.4 * Math.sin(2 * Math.PI * freq * i / SAMPLE_RATE);
  }
  return encodeWav(envelope(out, 0.01, 0.02, 0.7, 0.03));
}

export function generateWaterSfx(): Buffer {
  // Noise burst + 600Hz sine
  const dur = 0.15;
  const n = noise(dur, 0.2);
  // Low-pass the noise
  for (let i = 1; i < n.length; i++) {
    n[i] = n[i] * 0.4 + n[i - 1] * 0.6;
  }
  const s = sine(600, dur, 0.3);
  return encodeWav(envelope(mix(n, s), 0.005, 0.02, 0.6, 0.04));
}

export function generateHarvestSfx(): Buffer {
  // Ding at 1200Hz + harmonic
  const dur = 0.18;
  const s1 = sine(1200, dur, 0.4);
  const s2 = sine(2400, dur, 0.15);
  return encodeWav(envelope(mix(s1, s2), 0.005, 0.03, 0.5, 0.06));
}
