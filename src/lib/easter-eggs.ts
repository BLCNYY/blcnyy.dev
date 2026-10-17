"use client";

import { useSyncExternalStore } from "react";

// Window events the hidden features use to talk to each other.
export const EGG_EVENTS = {
  spell: "blcnyy:spell",
  burst: "blcnyy:burst",
  theme: "blcnyy:theme",
  warpBoost: "blcnyy:warp-boost",
  shipIt: "blcnyy:ship-it",
  openTerminal: "blcnyy:open-terminal",
  secret: "blcnyy:secret",
} as const;

type EggEvent = (typeof EGG_EVENTS)[keyof typeof EGG_EVENTS];

export function emitEgg(name: EggEvent, detail?: unknown) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

export function onEgg<T = unknown>(name: EggEvent, handler: (detail: T) => void) {
  const listener = (event: Event) => handler((event as CustomEvent<T>).detail);
  window.addEventListener(name, listener);
  return () => window.removeEventListener(name, listener);
}

export const SECRET_IDS = [
  "terminal",
  "console",
  "spell",
  "snake",
  "ship-it",
  "runaway-page",
] as const;

export type SecretId = (typeof SECRET_IDS)[number];

const STORAGE_KEY = "blcnyy:secrets";
const EMPTY: readonly SecretId[] = [];
const listeners = new Set<() => void>();
let cache: readonly SecretId[] | null = null;

const isSecretId = (value: unknown): value is SecretId =>
  typeof value === "string" && (SECRET_IDS as readonly string[]).includes(value);

function readSecrets(): readonly SecretId[] {
  if (cache) {
    return cache;
  }

  try {
    const parsed: unknown = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? "[]",
    );
    cache = Array.isArray(parsed) ? parsed.filter(isSecretId) : [];
  } catch {
    cache = [];
  }

  return cache;
}

export function unlockSecret(id: SecretId) {
  const found = readSecrets();

  if (found.includes(id)) {
    return false;
  }

  cache = [...found, id];

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {}

  listeners.forEach((listener) => listener());
  emitEgg(EGG_EVENTS.secret, id);
  return true;
}

function subscribeSecrets(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useFoundSecrets() {
  return useSyncExternalStore(subscribeSecrets, readSecrets, () => EMPTY);
}

export function getFoundSecrets() {
  return readSecrets();
}

export function isEditableTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    Boolean(target.closest("input, textarea, select, [contenteditable='true']"))
  );
}

export type ParticleTheme = {
  name: string;
  colors: string[];
  glow: [core: string, edge: string];
};

export const ORANGE_THEME: ParticleTheme = {
  name: "orange",
  colors: [
    "255, 106, 0",
    "255, 138, 31",
    "255, 179, 71",
    "255, 106, 0",
    "255, 138, 31",
    "255, 179, 71",
  ],
  glow: ["255, 120, 20", "255, 106, 0"],
};

const PRESET_THEMES: Record<string, ParticleTheme> = {
  orange: ORANGE_THEME,
  matrix: {
    name: "matrix",
    colors: [
      "0, 255, 110",
      "70, 255, 160",
      "170, 255, 210",
      "0, 230, 90",
      "120, 255, 180",
      "40, 255, 140",
    ],
    glow: ["60, 255, 140", "0, 220, 100"],
  },
  rainbow: {
    name: "rainbow",
    colors: [
      "255, 69, 58",
      "255, 159, 10",
      "255, 214, 10",
      "48, 209, 88",
      "10, 132, 255",
      "191, 90, 242",
    ],
    glow: ["255, 255, 255", "255, 170, 90"],
  },
};

type Rgb = [number, number, number];

// Resolves any CSS color (names, hex, rgb()) using the browser's own parser.
function parseCssColor(input: string): Rgb | null {
  const context = document.createElement("canvas").getContext("2d");

  if (!context) {
    return null;
  }

  context.fillStyle = "#010203";
  context.fillStyle = input;
  const first = context.fillStyle;
  context.fillStyle = "#040506";
  context.fillStyle = input;

  if (context.fillStyle !== first) {
    return null;
  }

  context.fillRect(0, 0, 1, 1);
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}

function themeFromRgb(name: string, [r, g, b]: Rgb): ParticleTheme {
  const tint = (amount: number) =>
    [r, g, b].map((channel) => Math.round(channel + (255 - channel) * amount)).join(", ");
  const shade = (amount: number) =>
    [r, g, b].map((channel) => Math.round(channel * (1 - amount))).join(", ");

  return {
    name,
    colors: [tint(0), tint(0.18), tint(0.36), tint(0.08), shade(0.12), tint(0.5)],
    glow: [tint(0.1), tint(0)],
  };
}

export type ThemeResult =
  | { ok: true; theme: ParticleTheme }
  | { ok: false; reason: "unknown" | "too-dark" };

export function resolveParticleTheme(input: string): ThemeResult {
  const name = input.trim().toLowerCase();
  const preset = PRESET_THEMES[name === "green" ? "matrix" : name];

  if (preset) {
    return { ok: true, theme: preset };
  }

  const rgb = name ? parseCssColor(name) : null;

  if (!rgb) {
    return { ok: false, reason: "unknown" };
  }

  // Particles are drawn additively, so very dark colors would be invisible.
  if (Math.max(...rgb) < 70) {
    return { ok: false, reason: "too-dark" };
  }

  return { ok: true, theme: themeFromRgb(name, rgb) };
}
