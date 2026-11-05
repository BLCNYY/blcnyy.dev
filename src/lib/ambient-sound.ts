"use client";

import { useSyncExternalStore } from "react";

// Optional ambient sound, made live with the Web Audio API: a soft pad whose
// chord follows the scene, a quiet chime between scenes, and the Purrloader
// cat's purr and chirp. It stays off until the visitor turns it on.

const STORAGE_KEY = "blcnyy:sound";
const MASTER_LEVEL = 0.45;
const DUCKED_LEVEL = 0.25;
const CHIME_GAP_MS = 350;

type Mood = {
  // Four pad notes, low to high, in Hz.
  notes: [number, number, number, number];
  // Lowpass cutoff in Hz: higher sounds brighter.
  brightness: number;
  level: number;
};

const MOODS: Record<string, Mood> = {
  halo: { notes: [110, 164.81, 246.94, 261.63], brightness: 720, level: 1 },
  waves: { notes: [87.31, 130.81, 164.81, 220], brightness: 680, level: 1 },
  spiral: { notes: [130.81, 196, 293.66, 329.63], brightness: 760, level: 1 },
  orb: { notes: [146.83, 220, 329.63, 440], brightness: 820, level: 0.95 },
  compass: { notes: [82.41, 123.47, 196, 293.66], brightness: 640, level: 1 },
  cat: { notes: [98, 146.83, 220, 246.94], brightness: 700, level: 0.95 },
  lattice: { notes: [110, 164.81, 220, 277.18], brightness: 700, level: 1 },
  camera: { notes: [116.54, 174.61, 220, 293.66], brightness: 760, level: 1 },
  starfield: { notes: [110, 164.81, 196, 261.63], brightness: 620, level: 0.9 },
  warp: { notes: [82.41, 123.47, 164.81, 185], brightness: 1500, level: 1.1 },
  ask: { notes: [130.81, 196, 246.94, 293.66], brightness: 780, level: 0.9 },
  reading: { notes: [87.31, 130.81, 174.61, 220], brightness: 520, level: 0.55 },
};

type Engine = {
  context: AudioContext;
  master: GainNode;
  padFilter: BiquadFilterNode;
  padGain: GainNode;
  voices: OscillatorNode[][];
  purrLevel: GainNode;
};

const listeners = new Set<() => void>();
let preference: boolean | null = null;
let engine: Engine | null = null;
let moodName = "halo";
let ducked = false;
let purr = 0;
let lastChime = 0;
let unlockInstalled = false;

function readPreference() {
  if (preference === null) {
    try {
      preference = window.localStorage.getItem(STORAGE_KEY) === "on";
    } catch {
      preference = false;
    }
  }

  return preference;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useSoundEnabled() {
  return useSyncExternalStore(subscribe, readPreference, () => false);
}

function isRunning(current: Engine | null): current is Engine {
  return Boolean(current && current.context.state === "running" && readPreference());
}

function brownNoise(context: AudioContext, seconds: number) {
  const length = Math.floor(context.sampleRate * seconds);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;

  for (let index = 0; index < length; index += 1) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    data[index] = last * 3.5;
  }

  return buffer;
}

function createEngine(): Engine | null {
  const AudioContextClass =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextClass) {
    return null;
  }

  const context = new AudioContextClass();
  const master = context.createGain();
  master.gain.value = 0;
  master.connect(context.destination);

  const padFilter = context.createBiquadFilter();
  padFilter.type = "lowpass";
  padFilter.frequency.value = MOODS[moodName].brightness;
  padFilter.Q.value = 0.4;
  const padGain = context.createGain();
  padGain.gain.value = MOODS[moodName].level;
  padFilter.connect(padGain).connect(master);

  // A very slow sweep of the filter keeps the pad gently moving.
  const sweep = context.createOscillator();
  sweep.frequency.value = 0.06;
  const sweepDepth = context.createGain();
  sweepDepth.gain.value = 220;
  sweep.connect(sweepDepth).connect(padFilter.frequency);
  sweep.start();

  const voices = MOODS[moodName].notes.map((frequency, index) => {
    const voiceGain = context.createGain();
    voiceGain.gain.value = 0.045;
    voiceGain.connect(padFilter);

    const swell = context.createOscillator();
    swell.frequency.value = 0.05 + index * 0.017;
    const swellDepth = context.createGain();
    swellDepth.gain.value = 0.02;
    swell.connect(swellDepth).connect(voiceGain.gain);
    swell.start();

    return [-5, 5].map((detune, layer) => {
      const oscillator = context.createOscillator();
      oscillator.type = layer === 0 ? "sine" : "triangle";
      oscillator.frequency.value = frequency;
      oscillator.detune.value = detune;
      oscillator.connect(voiceGain);
      oscillator.start();
      return oscillator;
    });
  });

  // The purr: low rumbling noise pulsed about 23 times a second.
  const noise = context.createBufferSource();
  noise.buffer = brownNoise(context, 2);
  noise.loop = true;
  const purrFilter = context.createBiquadFilter();
  purrFilter.type = "lowpass";
  purrFilter.frequency.value = 260;
  purrFilter.Q.value = 0.8;
  const purrPulse = context.createGain();
  purrPulse.gain.value = 0.5;
  const purrRate = context.createOscillator();
  purrRate.frequency.value = 23;
  const purrDepth = context.createGain();
  purrDepth.gain.value = 0.5;
  purrRate.connect(purrDepth).connect(purrPulse.gain);
  purrRate.start();
  const purrLevel = context.createGain();
  purrLevel.gain.value = 0;
  noise.connect(purrFilter).connect(purrPulse).connect(purrLevel).connect(master);
  noise.start();

  return { context, master, padFilter, padGain, voices, purrLevel };
}

function applyMood(current: Engine) {
  const mood = MOODS[moodName] ?? MOODS.halo;
  const now = current.context.currentTime;

  current.voices.forEach((oscillators, index) => {
    oscillators.forEach((oscillator) =>
      oscillator.frequency.setTargetAtTime(mood.notes[index], now, 0.7),
    );
  });
  current.padFilter.frequency.setTargetAtTime(mood.brightness, now, 0.9);
  current.padGain.gain.setTargetAtTime(mood.level, now, 0.9);
}

function applyMaster(current: Engine) {
  const target =
    readPreference() && document.visibilityState === "visible"
      ? MASTER_LEVEL * (ducked ? DUCKED_LEVEL : 1)
      : 0;

  current.master.gain.setTargetAtTime(target, current.context.currentTime, 0.35);
}

function start() {
  engine ??= createEngine();

  if (!engine) {
    return Promise.resolve(false);
  }

  const current = engine;
  applyMood(current);
  applyMaster(current);

  return current.context
    .resume()
    .then(() => current.context.state === "running")
    .catch(() => false);
}

function stop() {
  if (!engine) {
    return;
  }

  const current = engine;
  applyMaster(current);
  window.setTimeout(() => {
    if (!readPreference()) {
      void current.context.suspend();
    }
  }, 1200);
}

// Browsers only allow sound after a tap or key press, so a saved "on" waits
// for the first one.
export function initSound() {
  if (unlockInstalled) {
    return;
  }

  unlockInstalled = true;

  const unlock = () => {
    if (!readPreference()) {
      return;
    }

    void start().then((running) => {
      if (running) {
        window.removeEventListener("pointerdown", unlock);
        window.removeEventListener("pointerup", unlock);
        window.removeEventListener("keydown", unlock);
      }
    });
  };

  window.addEventListener("pointerdown", unlock);
  window.addEventListener("pointerup", unlock);
  window.addEventListener("keydown", unlock);
  document.addEventListener("visibilitychange", () => {
    if (!engine) {
      return;
    }

    applyMaster(engine);

    if (document.visibilityState === "visible" && readPreference()) {
      void engine.context.resume();
    }
  });
}

// Must be called from a click or key press.
export function toggleSound() {
  preference = !readPreference();

  try {
    window.localStorage.setItem(STORAGE_KEY, preference ? "on" : "off");
  } catch {}

  listeners.forEach((listener) => listener());

  if (preference) {
    void start();
  } else {
    stop();
  }
}

export function setSoundMood(name: string) {
  if (name === moodName || !MOODS[name]) {
    return;
  }

  moodName = name;

  if (engine) {
    applyMood(engine);
  }
}

// Turns the music down while Ask reads an answer aloud.
export function setSoundDucked(next: boolean) {
  if (next === ducked) {
    return;
  }

  ducked = next;

  if (engine) {
    applyMaster(engine);
  }
}

export function playChime() {
  const now = performance.now();

  if (!isRunning(engine) || now - lastChime < CHIME_GAP_MS) {
    return;
  }

  lastChime = now;
  const { context, master } = engine;
  const time = context.currentTime;
  const base = (MOODS[moodName] ?? MOODS.halo).notes[3] * 2;

  [1, 2.01, 3.02].forEach((ratio, partial) => {
    const oscillator = context.createOscillator();
    oscillator.frequency.value = base * ratio;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.07 / (partial + 1), time + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 1.8 / (partial + 1));
    oscillator.connect(gain).connect(master);
    oscillator.start(time);
    oscillator.stop(time + 2);
  });
}

// How much the cat is purring, from 0 to 1.
export function setPurr(level: number) {
  if (!isRunning(engine) || Math.abs(level - purr) < 0.02) {
    return;
  }

  purr = level;
  engine.purrLevel.gain.setTargetAtTime(level * 0.55, engine.context.currentTime, 0.08);
}

// A short, rising "mrrp" for when the cat gets petted.
export function playChirp() {
  if (!isRunning(engine)) {
    return;
  }

  const { context, master } = engine;
  const time = context.currentTime;
  const oscillator = context.createOscillator();
  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(380, time);
  oscillator.frequency.exponentialRampToValueAtTime(720, time + 0.09);
  oscillator.frequency.exponentialRampToValueAtTime(540, time + 0.22);
  const filter = context.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1100;
  filter.Q.value = 1.4;
  const gain = context.createGain();
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(0.22, time + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.3);
  oscillator.connect(filter).connect(gain).connect(master);
  oscillator.start(time);
  oscillator.stop(time + 0.32);
}
