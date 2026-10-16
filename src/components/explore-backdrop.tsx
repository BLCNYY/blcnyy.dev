"use client";

import { type RefObject, useEffect, useRef } from "react";

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

const PALETTE = ["255, 106, 0", "255, 138, 31", "255, 179, 71"];
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

function createSprites() {
  return PALETTE.map((rgb) => {
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

function createGlowSprite() {
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
    gradient.addColorStop(0, "rgba(255, 120, 20, 1)");
    gradient.addColorStop(0.35, "rgba(255, 106, 0, 0.35)");
    gradient.addColorStop(1, "rgba(255, 106, 0, 0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
  }

  return sprite;
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
      size: bright ? 2.6 + Math.random() * 1.2 : 0.8 + Math.random() * 1.3,
      alpha: bright ? 0.9 : 0.3 + Math.random() * 0.45,
      sprite: Math.floor(Math.random() * PALETTE.length),
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

      if (r3 < 0.58) {
        point = roundedRectPoint(r1 + time * 0.01, 1, 0.34);
      } else if (r3 < 0.93) {
        const angle = r1 * TAU + time * 0.08;
        point = [Math.cos(angle) * 0.44, Math.sin(angle) * 0.44];
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
    const sprites = createSprites();
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
    const glowSprite = createGlowSprite();
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

      if (reduceMotion && !needsDraw && position === lastPosition) {
        return;
      }

      lastPosition = position;
      needsDraw = false;

      const time = reduceMotion ? 0 : (now - startTime) / 1000;
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

        const parallax = 0.04 * (0.4 + particle.r3);
        const screenX = (centerX + (x - pointer.x * parallax) * unit) * dpr;
        const screenY = (centerY + (y - pointer.y * parallax) * unit) * dpr;
        const size = particle.size * 4 * dpr * scale * (1 + (fieldGlow - 1) * 0.3);

        context.globalAlpha = clamp(
          particle.alpha * depth * intensity * glow * fieldGlow,
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
        const a = formationPoint(from, index, particles.length, particle, time, layout);
        const b =
          from === to
            ? a
            : formationPoint(to, index, particles.length, particle, time, layout);
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

        drawParticle(
          particle,
          x,
          y,
          a[2] + (b[2] - a[2]) * eased,
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
          const [x, y, depth, scale = 1] = warpStreamPoint(particle, time, layout, 1.25);
          drawParticle(particle, x * expand, y * expand, depth, scale, finaleWeight);
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
    document.addEventListener("mouseout", releasePointer);
    window.addEventListener("blur", deactivatePointer);
    frame = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", trackPointer);
      document.removeEventListener("mouseout", releasePointer);
      window.removeEventListener("blur", deactivatePointer);
    };
  }, [formations, positionRef]);

  return <canvas ref={canvasRef} className="explore-backdrop" aria-hidden="true" />;
}
