"use client";

import { type RefObject, useEffect, useRef } from "react";

import {
  EGG_EVENTS,
  ORANGE_THEME,
  type ParticleTheme,
  onEgg,
} from "@/lib/easter-eggs";

export type BackdropFormation =
  | "halo"
  | "waves"
  | "spiral"
  | "orb"
  | "compass"
  | "lattice"
  | "camera"
  | "starfield"
  | "warp";

type ExploreBackdropProps = {
  formations: readonly BackdropFormation[];
  positionRef: RefObject<number>;
};

type Particle = {
  r1: number;
  r2: number;
  r3: number;
  delay: number;
  introDelay: number;
  offsetX: number;
  offsetY: number;
  burstX: number;
  burstY: number;
  burstVX: number;
  burstVY: number;
  lastX: number;
  lastY: number;
  size: number;
  alpha: number;
  sprite: number;
};

type Layout = {
  width: number;
  height: number;
  dpr: number;
  unit: number;
  span: number;
  vspan: number;
  side: number;
  wide: boolean;
};

// x and y are in layout units from the screen center; depth scales alpha and
// scale (default 1) scales size.
type Point = [x: number, y: number, depth: number, scale?: number];

const PARTICLE_COLORS = ORANGE_THEME.colors.length;
// Survives remounts so a theme picked in the terminal sticks while browsing.
let currentTheme: ParticleTheme = ORANGE_THEME;

// Easter egg tuning: fireworks bursts, the spelled name, and the warp boost.
const BURST_STIFFNESS = 10;
const BURST_DAMPING = 3.2;
const SPELL_RISE = 0.9;
const SPELL_HOLD = 3.4;
const SPELL_FALL = 1.2;
const SPELL_TEXT = "BLCNYY";
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const TAU = Math.PI * 2;
const STAGGER = 0.4;
const SPRITE_SIZE = 32;
// Opening sequence: particles spiral in from beyond the screen edges and land
// in a clockwise sweep. Plays once per page load.
const INTRO_SWEEP = 0.75;
const INTRO_SCATTER = 0.3;
const INTRO_FLIGHT = 1.9;
const INTRO_TOTAL = INTRO_SWEEP + INTRO_SCATTER + INTRO_FLIGHT;

let introPlayed = false;

// Cursor force field, in layout units: particles inside the radius are pushed
// aside with a slight swirl and spring back once the cursor moves on.
const FIELD_RADIUS = 0.42;
const FIELD_PUSH = 0.14;
const FIELD_SWIRL = 0.07;
const FIELD_SPRING = 0.14;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

function easeOutQuart(t: number) {
  return 1 - (1 - t) ** 4;
}

function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

function createSprites(theme: ParticleTheme) {
  return theme.colors.map((rgb) => {
    const sprite = document.createElement("canvas");
    sprite.width = SPRITE_SIZE;
    sprite.height = SPRITE_SIZE;
    const context = sprite.getContext("2d");

    if (context) {
      const radius = SPRITE_SIZE / 2;
      const gradient = context.createRadialGradient(
        radius,
        radius,
        0,
        radius,
        radius,
        radius,
      );
      gradient.addColorStop(0, `rgba(${rgb}, 1)`);
      gradient.addColorStop(0.18, `rgba(${rgb}, 0.85)`);
      gradient.addColorStop(0.45, `rgba(${rgb}, 0.22)`);
      gradient.addColorStop(1, `rgba(${rgb}, 0)`);
      context.fillStyle = gradient;
      context.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
    }

    return sprite;
  });
}

function createGlowSprite(theme: ParticleTheme) {
  const [core, edge] = theme.glow;
  const size = 128;
  const sprite = document.createElement("canvas");
  sprite.width = size;
  sprite.height = size;
  const context = sprite.getContext("2d");

  if (context) {
    const gradient = context.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2,
    );
    gradient.addColorStop(0, `rgba(${core}, 1)`);
    gradient.addColorStop(0.35, `rgba(${edge}, 0.35)`);
    gradient.addColorStop(1, `rgba(${edge}, 0)`);
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
  }

  return sprite;
}

// Samples points inside the rendered text, in layout units, shuffled so any
// prefix covers the whole word evenly.
function computeSpellTargets(text: string, layout: Layout): [number, number][] {
  const { width, height, unit } = layout;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    return [];
  }

  const fontSize = Math.min(width * 0.2, height * 0.34);
  context.font = `800 ${fontSize}px ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "#ffffff";
  context.fillText(text, width / 2, height / 2);

  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
  const step = Math.max(2, Math.round(fontSize / 80));
  const points: [number, number][] = [];

  for (let y = 0; y < canvas.height; y += step) {
    for (let x = 0; x < canvas.width; x += step) {
      if (data[(y * canvas.width + x) * 4 + 3] > 128) {
        points.push([(x - width / 2) / unit, (y - height / 2) / unit]);
      }
    }
  }

  for (let index = points.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [points[index], points[swap]] = [points[swap], points[index]];
  }

  return points;
}

function spellWeightAt(age: number) {
  if (age < 0) return 0;
  if (age < SPELL_RISE) return easeInOutCubic(age / SPELL_RISE);
  if (age < SPELL_HOLD) return 1;
  if (age < SPELL_HOLD + SPELL_FALL) {
    return 1 - easeInOutCubic((age - SPELL_HOLD) / SPELL_FALL);
  }
  return 0;
}

function createParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, index) => {
    const bright = Math.random() < 0.06;

    return {
      r1: Math.random(),
      r2: Math.random(),
      r3: Math.random(),
      delay: Math.random() * STAGGER,
      introDelay: (index / count) * INTRO_SWEEP + Math.random() * INTRO_SCATTER,
      offsetX: 0,
      offsetY: 0,
      burstX: 0,
      burstY: 0,
      burstVX: 0,
      burstVY: 0,
      lastX: 0,
      lastY: 0,
      size: bright ? 2.6 + Math.random() * 1.2 : 0.8 + Math.random() * 1.3,
      alpha: bright ? 0.9 : 0.3 + Math.random() * 0.45,
      sprite: Math.floor(Math.random() * PARTICLE_COLORS),
    };
  });
}

function getLayout(width: number, height: number, dpr: number): Layout {
  const unit = Math.min(width, height) / 2;
  const span = width / 2 / unit;
  const wide = width >= 900;

  return {
    width,
    height,
    dpr,
    unit,
    span,
    vspan: height / 2 / unit,
    // Scenes with left-aligned copy get their shape on the right.
    side: wide ? span * 0.48 : 0,
    wide,
  };
}

function roundedRectPoint(
  u: number,
  half: number,
  radius: number,
): [number, number] {
  const inner = half - radius;
  const straight = 2 * inner;
  const arc = (Math.PI / 2) * radius;
  let distance = (u % 1) * 4 * (straight + arc);
  const edges: ((t: number) => [number, number])[] = [
    (t) => [-inner + t * straight, -half],
    (t) => [half, -inner + t * straight],
    (t) => [inner - t * straight, half],
    (t) => [-half, inner - t * straight],
  ];
  const corners = [
    [inner, -inner, -Math.PI / 2],
    [inner, inner, 0],
    [-inner, inner, Math.PI / 2],
    [-inner, -inner, Math.PI],
  ];

  for (let side = 0; side < 4; side += 1) {
    if (distance < straight) {
      return edges[side](distance / straight);
    }

    distance -= straight;

    if (distance < arc) {
      const [cx, cy, start] = corners[side];
      const angle = start + (distance / arc) * (Math.PI / 2);
      return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius];
    }

    distance -= arc;
  }

  return [-inner, -half];
}

// Particles flying out of the screen center toward the viewer. A higher curve
// keeps them near the core longer; a lower one spreads them evenly.
function warpStreamPoint(
  particle: Particle,
  time: number,
  layout: Layout,
  curve: number,
): Point {
  const { r1, r2, r3 } = particle;
  const travel = (r2 + time * (0.05 + r3 * 0.07)) % 1;
  const reach = Math.hypot(layout.span, layout.vspan) * 1.15;
  const radius = 0.12 + travel ** curve * reach;
  const angle = r1 * TAU + travel * 0.9 + time * 0.03;

  return [
    Math.cos(angle) * radius,
    Math.sin(angle) * radius,
    (0.25 + 0.75 * travel) * Math.min(1, travel * 6),
    0.7 + travel * 1.6,
  ];
}

function starfieldPoint(particle: Particle, time: number, layout: Layout): Point {
  const drift = (particle.r2 + time * 0.006 * (0.4 + particle.r3)) % 1;

  return [
    (particle.r1 * 2 - 1) * layout.span * 1.05,
    (1 - drift * 2) * layout.vspan * 1.05,
    0.35 + particle.r3 * 0.5,
  ];
}

function formationPoint(
  formation: BackdropFormation,
  index: number,
  count: number,
  particle: Particle,
  time: number,
  layout: Layout,
): Point {
  const { r1, r2, r3 } = particle;

  switch (formation) {
    case "halo": {
      if (r3 < 0.2) {
        return starfieldPoint(particle, time, layout);
      }

      const angle = (index / count) * TAU + time * 0.05;
      const radius =
        0.82 + (r1 - 0.5) * 0.14 + Math.sin(angle * 3 + time * 0.7) * 0.025;
      return [Math.cos(angle) * radius, Math.sin(angle) * radius, 1];
    }
    case "waves": {
      const lines = 6;
      const line = index % lines;
      const x = (r1 * 2 - 1) * layout.span * 1.08;
      const base = layout.vspan * 0.6 + (line - (lines - 1) / 2) * 0.065;
      const y =
        base + Math.sin(x * 2.3 + time * 0.75 + line * 0.85) * (0.045 + line * 0.01);
      return [x, y, 0.55 + 0.45 * Math.abs(Math.sin(x + line))];
    }
    case "spiral": {
      const k = index + 1;
      const angle = k * GOLDEN_ANGLE + time * 0.04;
      const radius = 0.86 * Math.sqrt(k / count);
      return [
        layout.side + Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        0.45 + 0.55 * (1 - radius),
      ];
    }
    case "orb": {
      const y0 = 1 - (2 * (index + 0.5)) / count;
      const ring = Math.sqrt(1 - y0 * y0);
      const theta = index * GOLDEN_ANGLE + time * 0.22;
      const x0 = Math.cos(theta) * ring;
      const z0 = Math.sin(theta) * ring;
      const tilt = 0.4;
      const y1 = y0 * Math.cos(tilt) - z0 * Math.sin(tilt);
      const z1 = y0 * Math.sin(tilt) + z0 * Math.cos(tilt);
      const scale = (0.62 * 2.4) / (2.4 - z1);
      return [layout.side + x0 * scale, y1 * scale, 0.25 + 0.75 * ((z1 + 1) / 2)];
    }
    case "compass": {
      if (r3 < 0.55) {
        const angle = r1 * TAU + time * 0.02;
        const radius = 0.7 + (r2 - 0.5) * 0.03;
        return [layout.side + Math.cos(angle) * radius, Math.sin(angle) * radius, 0.8];
      }

      if (r3 < 0.8) {
        const tick = index % 24;
        const major = tick % 6 === 0;
        const angle = (tick / 24) * TAU;
        const radius = 0.6 - r1 * (major ? 0.12 : 0.05);
        return [
          layout.side + Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          major ? 1 : 0.6,
        ];
      }

      const heading = -2.35 + Math.sin(time * 0.5) * 0.12;
      const along = r1 * 2 - 1;
      const width = (r2 - 0.5) * 0.05 * (1 - Math.abs(along));
      return [
        layout.side + Math.cos(heading) * along * 0.5 - Math.sin(heading) * width,
        Math.sin(heading) * along * 0.5 + Math.cos(heading) * width,
        along > 0 ? 1 : 0.45,
      ];
    }
    case "camera": {
      const centerX = layout.wide ? layout.side + 0.05 : 0;
      const centerY = layout.wide ? 0 : layout.vspan * 0.42;
      const scale = layout.wide ? 0.6 : 0.42;
      let point: [number, number];

      if (r3 < 0.5) {
        point = roundedRectPoint(r1 + time * 0.01, 1, 0.34);
      } else if (r3 < 0.76) {
        const angle = r1 * TAU + time * 0.08;
        point = [Math.cos(angle) * 0.44, Math.sin(angle) * 0.44];
      } else if (r3 < 0.94) {
        // A play button inside the lens, for the YouTube channel.
        const corners: [number, number][] = [
          [0.25, 0],
          [-0.13, -0.22],
          [-0.13, 0.22],
        ];
        const edge = Math.min(2, Math.floor(r1 * 3));
        const along = r1 * 3 - edge;
        const [startX, startY] = corners[edge];
        const [endX, endY] = corners[(edge + 1) % 3];
        point = [startX + (endX - startX) * along, startY + (endY - startY) * along];
      } else {
        const angle = r1 * TAU;
        point = [0.62 + Math.cos(angle) * 0.07 * r2, -0.62 + Math.sin(angle) * 0.07 * r2];
      }

      return [centerX + point[0] * scale, centerY + point[1] * scale, 0.9];
    }
    case "warp": {
      // A glowing core that particles stream out of toward the viewer,
      // speeding up and growing until they leave the screen.
      if (r3 < 0.14) {
        const theta = r1 * TAU + time * 0.3;
        const phi = Math.acos(2 * r2 - 1);
        const radius = 0.15 * Math.cbrt(r3 / 0.14) * (1 + 0.06 * Math.sin(time * 1.4));
        return [
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.cos(phi),
          1,
        ];
      }

      return warpStreamPoint(particle, time, layout, 2.2);
    }
    case "lattice": {
      const columns = Math.ceil(Math.sqrt(count));
      const column = index % columns;
      const row = Math.floor(index / columns);
      return [
        layout.side + (column / (columns - 1) - 0.5) * 1.3,
        (row / (columns - 1) - 0.5) * 1.3 + Math.sin(time * 0.8 + column * 0.45) * 0.02,
        0.7,
      ];
    }
    case "starfield":
    default:
      return starfieldPoint(particle, time, layout);
  }
}

export function ExploreBackdrop({ formations, positionRef }: ExploreBackdropProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context || !formations.length) {
      return;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const playIntro = !reduceMotion && !introPlayed;
    let sprites = createSprites(currentTheme);
    const pointer = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      fieldX: 0,
      fieldY: 0,
      strength: 0,
      active: false,
    };
    let glowSprite = createGlowSprite(currentTheme);
    let spellTargets: [number, number][] = [];
    let spellStart = Number.NEGATIVE_INFINITY;
    let burstEnergy = 0;
    let warpBoost = 0;
    let warpBoostTarget = 0;
    let warpTime = 0;
    let lastFrame = performance.now();
    const startTime = performance.now();
    let layout = getLayout(1, 1, 1);
    let particles: Particle[] = [];
    // Extra particles that only appear on the warp scene to fill the screen.
    let finaleParticles: Particle[] = [];
    const warpIndex = formations.lastIndexOf("warp");
    let frame = 0;
    let lastPosition = Number.NaN;
    let needsDraw = true;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      layout = getLayout(width, height, dpr);

      const count = Math.round(clamp((width * height) / 1100, 480, 1300));

      if (particles.length !== count) {
        particles = createParticles(count);
      }

      const finaleCount = Math.round(clamp((width * height) / 320, 900, 4200));

      if (warpIndex >= 0 && finaleParticles.length !== finaleCount) {
        finaleParticles = createParticles(finaleCount);
      }

      needsDraw = true;
    };

    const trackPointer = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") {
        return;
      }

      pointer.targetX = event.clientX / window.innerWidth - 0.5;
      pointer.targetY = event.clientY / window.innerHeight - 0.5;

      if (!pointer.active) {
        // Start the field where the cursor enters instead of sliding in.
        pointer.fieldX = pointer.targetX;
        pointer.fieldY = pointer.targetY;
      }

      pointer.active = true;
    };

    const releasePointer = (event: MouseEvent) => {
      if (!event.relatedTarget) {
        pointer.active = false;
      }
    };

    const deactivatePointer = () => {
      pointer.active = false;
    };

    const render = (now: number) => {
      frame = window.requestAnimationFrame(render);

      const position = clamp(positionRef.current ?? 0, 0, formations.length - 1);

      const delta = Math.min(now - lastFrame, 100) / 1000;
      lastFrame = now;
      const spellWeight = spellWeightAt((now - spellStart) / 1000);
      burstEnergy *= 0.97;
      const effectsActive = spellWeight > 0 || burstEnergy > 0.01;

      if (reduceMotion && !needsDraw && !effectsActive && position === lastPosition) {
        return;
      }

      lastPosition = position;
      needsDraw = false;

      const time = reduceMotion ? 0 : (now - startTime) / 1000;
      warpBoost += (warpBoostTarget - warpBoost) * 0.06;

      if (!reduceMotion) {
        // The warp tunnel keeps its own clock so it can speed up smoothly.
        warpTime += delta * (1 + warpBoost * 5);
      }

      const timeFor = (formation: BackdropFormation) =>
        formation === "warp" ? warpTime : time;
      const introTime = playIntro ? time : Number.POSITIVE_INFINITY;
      const introActive = introTime < INTRO_TOTAL;

      if (playIntro && !introActive) {
        introPlayed = true;
      }
      const fromIndex = Math.floor(position);
      const toIndex = Math.min(fromIndex + 1, formations.length - 1);
      const progress = position - fromIndex;
      const from = formations[fromIndex];
      const to = formations[toIndex];
      const { width, height, dpr, unit, wide } = layout;
      const intensity = wide ? 1 : 0.6;
      const centerX = width / 2;
      const centerY = height / 2;

      pointer.x += (pointer.targetX - pointer.x) * 0.04;
      pointer.y += (pointer.targetY - pointer.y) * 0.04;
      pointer.fieldX += (pointer.targetX - pointer.fieldX) * 0.25;
      pointer.fieldY += (pointer.targetY - pointer.fieldY) * 0.25;
      pointer.strength +=
        ((pointer.active && !reduceMotion ? 1 : 0) - pointer.strength) * 0.08;

      const fieldX = (pointer.fieldX * width) / unit;
      const fieldY = (pointer.fieldY * height) / unit;
      const fieldStrength = pointer.strength;

      context.setTransform(1, 0, 0, 1, 0, 0);

      if (introActive) {
        // Fade the previous frame instead of clearing it, leaving comet trails
        // that shorten as the particles settle.
        context.globalCompositeOperation = "destination-out";
        context.globalAlpha =
          0.14 + 0.86 * smoothstep(clamp(introTime / INTRO_TOTAL, 0, 1));
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.globalAlpha = 1;
      } else {
        context.clearRect(0, 0, canvas.width, canvas.height);
      }

      context.globalCompositeOperation = "lighter";
      const launchRadius = Math.hypot(layout.span, layout.vspan) * 1.1;

      const drawParticle = (
        particle: Particle,
        baseX: number,
        baseY: number,
        depth: number,
        scale: number,
        glow: number,
      ) => {
        let x = baseX;
        let y = baseY;
        let fieldGlow = 1;
        let targetOffsetX = 0;
        let targetOffsetY = 0;

        if (fieldStrength > 0.001) {
          const awayX = x - fieldX;
          const awayY = y - fieldY;
          const distance = Math.hypot(awayX, awayY) || 0.0001;
          const falloff = Math.max(0, 1 - distance / FIELD_RADIUS) ** 2 * fieldStrength;

          if (falloff > 0) {
            const normalX = awayX / distance;
            const normalY = awayY / distance;
            const push = falloff * FIELD_PUSH * (0.6 + particle.r1 * 0.8);
            const swirl = falloff * FIELD_SWIRL;

            targetOffsetX = normalX * push - normalY * swirl;
            targetOffsetY = normalY * push + normalX * swirl;
            fieldGlow = 1 + falloff * 1.6;
          }
        }

        particle.offsetX += (targetOffsetX - particle.offsetX) * FIELD_SPRING;
        particle.offsetY += (targetOffsetY - particle.offsetY) * FIELD_SPRING;
        x += particle.offsetX;
        y += particle.offsetY;

        if (particle.burstVX || particle.burstVY || particle.burstX || particle.burstY) {
          // Damped spring: fly out, overshoot slightly, settle back.
          particle.burstVX += (-BURST_STIFFNESS * particle.burstX - BURST_DAMPING * particle.burstVX) * delta;
          particle.burstVY += (-BURST_STIFFNESS * particle.burstY - BURST_DAMPING * particle.burstVY) * delta;
          particle.burstX += particle.burstVX * delta;
          particle.burstY += particle.burstVY * delta;

          if (Math.abs(particle.burstX) + Math.abs(particle.burstVX) < 0.0005) {
            particle.burstX = 0;
            particle.burstY = 0;
            particle.burstVX = 0;
            particle.burstVY = 0;
          }
        }

        x += particle.burstX;
        y += particle.burstY;
        particle.lastX = x;
        particle.lastY = y;
        const burstGlow = 1 + Math.min(1.4, Math.hypot(particle.burstVX, particle.burstVY) * 0.25);

        const parallax = 0.04 * (0.4 + particle.r3);
        const screenX = (centerX + (x - pointer.x * parallax) * unit) * dpr;
        const screenY = (centerY + (y - pointer.y * parallax) * unit) * dpr;
        const size =
          particle.size * 4 * dpr * scale * (1 + (fieldGlow - 1) * 0.3) * burstGlow;

        context.globalAlpha = clamp(
          particle.alpha * depth * intensity * glow * fieldGlow * burstGlow,
          0,
          1,
        );
        context.drawImage(
          sprites[particle.sprite],
          screenX - size / 2,
          screenY - size / 2,
          size,
          size,
        );
      };

      for (let index = 0; index < particles.length; index += 1) {
        const particle = particles[index];
        const a = formationPoint(
          from,
          index,
          particles.length,
          particle,
          timeFor(from),
          layout,
        );
        const b =
          from === to
            ? a
            : formationPoint(to, index, particles.length, particle, timeFor(to), layout);
        const local = clamp((progress * (1 + STAGGER) - particle.delay), 0, 1);
        const eased = easeInOutCubic(local);
        // Bend each path sideways mid-flight so shapes swirl into each other.
        const swirl = Math.sin(Math.PI * eased) * (particle.r2 - 0.5) * 0.5;
        const dx = b[0] - a[0];
        const dy = b[1] - a[1];
        const shimmer = reduceMotion ? 0 : Math.sin(time * 0.9 + particle.r1 * TAU) * 0.006;
        let x = a[0] + dx * eased - dy * swirl + shimmer;
        let y = a[1] + dy * eased + dx * swirl + shimmer;
        let introGlow = 1;
        let introScale = 1;

        if (introActive) {
          const flight = (introTime - particle.introDelay) / INTRO_FLIGHT;

          if (flight <= 0) {
            continue;
          }

          if (flight < 1) {
            // Spiral in along polar coordinates around the screen center.
            const landed = easeOutQuart(flight);
            const targetRadius = Math.hypot(x, y);
            const targetAngle = Math.atan2(y, x);
            const startRadius = launchRadius + particle.r2 * 0.6;
            const sweep = (0.9 + particle.r3 * 0.7) * Math.PI;
            const radius = startRadius + (targetRadius - startRadius) * landed;
            const angle = targetAngle - sweep * (1 - landed);

            x = Math.cos(angle) * radius;
            y = Math.sin(angle) * radius;
            introGlow = Math.min(1, flight * 3) * (1 + 0.8 * Math.sin(Math.PI * flight));
            introScale = 1 + 0.6 * (1 - landed);
          }
        }

        let depth = a[2] + (b[2] - a[2]) * eased;

        if (spellWeight > 0 && spellTargets.length) {
          const [targetX, targetY] = spellTargets[index % spellTargets.length];
          x += (targetX - x) * spellWeight;
          y += (targetY - y) * spellWeight;
          depth += (1 - depth) * spellWeight;
        }

        drawParticle(
          particle,
          x,
          y,
          depth,
          introScale * ((a[3] ?? 1) + ((b[3] ?? 1) - (a[3] ?? 1)) * eased),
          introGlow,
        );
      }

      const finaleWeight =
        warpIndex >= 0 ? clamp(1 - Math.abs(position - warpIndex), 0, 1) : 0;

      if (finaleWeight > 0.001) {
        // Burst out of the core as the scene arrives; collapse back on leaving.
        const expand = easeOutQuart(finaleWeight);

        for (const particle of finaleParticles) {
          const [x, y, depth, scale = 1] = warpStreamPoint(
            particle,
            warpTime,
            layout,
            1.25,
          );
          drawParticle(
            particle,
            x * expand,
            y * expand,
            depth,
            scale * (1 + warpBoost * 0.6),
            finaleWeight * (1 + warpBoost * 0.7),
          );
        }
      }

      if (fieldStrength > 0.01) {
        // A faint light that follows the cursor.
        const glowSize = FIELD_RADIUS * 2.6 * unit * dpr;
        const glowX = (centerX + fieldX * unit) * dpr;
        const glowY = (centerY + fieldY * unit) * dpr;

        context.globalAlpha = 0.16 * fieldStrength * intensity;
        context.drawImage(
          glowSprite,
          glowX - glowSize / 2,
          glowY - glowSize / 2,
          glowSize,
          glowSize,
        );
      }

      context.globalAlpha = 1;
      context.globalCompositeOperation = "source-over";
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();
    window.addEventListener("pointermove", trackPointer, { passive: true });

    const burst = () => {
      burstEnergy = 1;

      for (const particle of [...particles, ...finaleParticles]) {
        const angle =
          Math.atan2(particle.lastY, particle.lastX) + (Math.random() - 0.5) * 0.8;
        const speed = 2.2 + Math.random() * 4.2;
        particle.burstVX += Math.cos(angle) * speed;
        particle.burstVY += Math.sin(angle) * speed;
      }
    };

    const stopEggs = [
      onEgg(EGG_EVENTS.burst, burst),
      onEgg(EGG_EVENTS.spell, () => {
        spellTargets = computeSpellTargets(SPELL_TEXT, layout);
        spellStart = performance.now();
      }),
      onEgg<ParticleTheme>(EGG_EVENTS.theme, (theme) => {
        if (theme?.colors?.length === PARTICLE_COLORS) {
          currentTheme = theme;
          sprites = createSprites(theme);
          glowSprite = createGlowSprite(theme);
          needsDraw = true;
        }
      }),
      onEgg<number>(EGG_EVENTS.warpBoost, (boost) => {
        warpBoostTarget = clamp(Number(boost) || 0, 0, 1);
      }),
    ];
    document.addEventListener("mouseout", releasePointer);
    window.addEventListener("blur", deactivatePointer);
    frame = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", trackPointer);
      stopEggs.forEach((stop) => stop());
      document.removeEventListener("mouseout", releasePointer);
      window.removeEventListener("blur", deactivatePointer);
    };
  }, [formations, positionRef]);

  return <canvas ref={canvasRef} className="explore-backdrop" aria-hidden="true" />;
}
