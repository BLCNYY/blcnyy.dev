"use client";

import { useEffect, useRef, useState } from "react";

import { createGlowSprite, readBest, saveBest } from "@/components/easter-eggs/game-utils";
import { getDictionary } from "@/lib/dictionaries";
import { unlockSecret } from "@/lib/easter-eggs";
import type { Locale } from "@/lib/i18n";

type Status = "ready" | "playing" | "over";

type Hazard = {
  x: number;
  y: number;
  width: number;
  label: string;
  bonus: boolean;
  speed: number;
};

type Spark = { x: number; y: number; vx: number; vy: number; life: number };
type Star = { x: number; y: number; depth: number };

const BEST_KEY = "blcnyy:ship-it-best";
const HAZARD_HEIGHT = 30;
const BUGS = [
  "merge conflict",
  "flaky test",
  "prod bug",
  "CORS error",
  "undefined is not a function",
  "429 rate limit",
  "missing semicolon",
  "works on my machine",
  "null pointer",
  "infinite loop",
  "it's DNS",
  "memory leak",
  "regression",
  "npm install",
];
const BONUSES = ["tests ✓", "LGTM ✓", "CI ✓"];
const FONT = '600 13px "IBM Plex Mono", ui-monospace, monospace';

export function ShipItGame({
  locale,
  onClose,
}: {
  locale: Locale;
  onClose: () => void;
}) {
  const copy = getDictionary(locale).eggs.shipIt;
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onCloseRef = useRef(onClose);
  const deployedRef = useRef(copy.deployed);
  const [status, setStatus] = useState<Status>("ready");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => readBest(BEST_KEY));
  const [banner, setBanner] = useState<{ text: string; key: number } | null>(null);

  useEffect(() => {
    onCloseRef.current = onClose;
    deployedRef.current = copy.deployed;
  }, [onClose, copy.deployed]);

  useEffect(() => {
    if (!banner) {
      return;
    }

    const timer = window.setTimeout(() => setBanner(null), 1600);
    return () => window.clearTimeout(timer);
  }, [banner]);

  useEffect(() => {
    unlockSecret("ship-it");

    const root = rootRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!root || !canvas || !context) {
      return;
    }

    const glow = createGlowSprite("255, 122, 0", 64);
    let dpr = 1;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let state: Status = "ready";
    let shipX = width / 2;
    let targetX = width / 2;
    let hazards: Hazard[] = [];
    let sparks: Spark[] = [];
    let stars: Star[] = [];
    let elapsed = 0;
    let spawnIn = 0;
    let points = 0;
    let milestone = 1;
    let frame = 0;
    let last = performance.now();
    const held = new Set<string>();

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      stars = Array.from({ length: 140 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        depth: 0.3 + Math.random() * 0.7,
      }));
    };

    const shipY = () => height - 120;

    const start = () => {
      hazards = [];
      sparks = [];
      elapsed = 0;
      spawnIn = 0.6;
      points = 0;
      milestone = 1;
      shipX = width / 2;
      targetX = width / 2;
      setScore(0);
      state = "playing";
      setStatus("playing");
    };

    const crash = () => {
      state = "over";
      setStatus("over");
      sparks = Array.from({ length: 60 }, () => {
        const angle = Math.random() * Math.PI * 2;
        const speed = 80 + Math.random() * 320;
        return {
          x: shipX,
          y: shipY(),
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
        };
      });
      const finalScore = Math.floor(points);
      setBest((previous) => {
        const next = Math.max(previous, finalScore);
        saveBest(BEST_KEY, next);
        return next;
      });
    };

    const spawn = () => {
      const bonus = Math.random() < 0.12;
      const label = bonus
        ? BONUSES[Math.floor(Math.random() * BONUSES.length)]
        : BUGS[Math.floor(Math.random() * BUGS.length)];
      context.font = FONT;
      const hazardWidth = context.measureText(label).width + 28;

      hazards.push({
        x: 16 + Math.random() * Math.max(1, width - hazardWidth - 32),
        y: -HAZARD_HEIGHT,
        width: hazardWidth,
        label,
        bonus,
        speed: Math.min(640, 190 + elapsed * 9 + Math.random() * 70),
      });
    };

    const update = (delta: number) => {
      const speedFactor = 1 + elapsed / 25;

      for (const star of stars) {
        star.y += delta * (120 + 380 * star.depth) * (state === "playing" ? speedFactor : 0.4);

        if (star.y > height) {
          star.y -= height;
          star.x = Math.random() * width;
        }
      }

      for (const spark of sparks) {
        spark.x += spark.vx * delta;
        spark.y += spark.vy * delta;
        spark.life -= delta * 1.1;
      }

      sparks = sparks.filter((spark) => spark.life > 0);

      if (state !== "playing") {
        return;
      }

      elapsed += delta;
      const keyboard = (held.has("right") ? 1 : 0) - (held.has("left") ? 1 : 0);

      if (keyboard) {
        targetX += keyboard * 560 * delta;
      }

      targetX = Math.min(Math.max(targetX, 24), width - 24);
      shipX += (targetX - shipX) * Math.min(1, delta * 14);

      spawnIn -= delta;

      if (spawnIn <= 0) {
        spawn();
        spawnIn = Math.max(0.26, 0.85 - elapsed * 0.012) * (0.7 + Math.random() * 0.6);
      }

      const top = shipY() - 18;
      const bottom = shipY() + 20;

      for (const hazard of hazards) {
        hazard.y += hazard.speed * delta;

        const overlaps =
          hazard.y + HAZARD_HEIGHT > top &&
          hazard.y < bottom &&
          hazard.x < shipX + 12 &&
          hazard.x + hazard.width > shipX - 12;

        if (overlaps) {
          if (hazard.bonus) {
            points += 150;
            hazard.y = height + 100;
          } else {
            crash();
            return;
          }
        }
      }

      hazards = hazards.filter((hazard) => hazard.y < height + 40);
      points += delta * 60 * speedFactor;
      const rounded = Math.floor(points);
      setScore(rounded);

      if (rounded >= milestone * 1000) {
        milestone += 1;
        setBanner({ text: deployedRef.current(milestone), key: rounded });
      }
    };

    const drawPill = (hazard: Hazard) => {
      const radius = HAZARD_HEIGHT / 2;
      context.beginPath();
      context.roundRect(hazard.x, hazard.y, hazard.width, HAZARD_HEIGHT, radius);
      context.fillStyle = hazard.bonus ? "rgba(255, 255, 255, 0.92)" : "rgba(255, 94, 0, 0.16)";
      context.fill();
      context.lineWidth = 1;
      context.strokeStyle = hazard.bonus ? "#ffffff" : "rgba(255, 138, 31, 0.75)";
      context.stroke();
      context.fillStyle = hazard.bonus ? "#160a00" : "#ffd3b0";
      context.font = FONT;
      context.textBaseline = "middle";
      context.fillText(hazard.label, hazard.x + 14, hazard.y + HAZARD_HEIGHT / 2 + 1);
    };

    const drawShip = (now: number) => {
      const y = shipY();
      const flame = 14 + Math.sin(now / 40) * 4 + Math.random() * 3;

      context.globalCompositeOperation = "lighter";
      context.globalAlpha = 0.9;
      context.drawImage(glow, shipX - 28, y + 6, 56, 56);
      context.globalCompositeOperation = "source-over";
      context.globalAlpha = 1;

      context.beginPath();
      context.moveTo(shipX - 7, y + 16);
      context.lineTo(shipX, y + 16 + flame);
      context.lineTo(shipX + 7, y + 16);
      context.fillStyle = "#ffb000";
      context.fill();

      context.beginPath();
      context.moveTo(shipX, y - 22);
      context.quadraticCurveTo(shipX + 14, y - 4, shipX + 11, y + 16);
      context.lineTo(shipX - 11, y + 16);
      context.quadraticCurveTo(shipX - 14, y - 4, shipX, y - 22);
      context.fillStyle = "#ffffff";
      context.fill();

      context.beginPath();
      context.arc(shipX, y - 3, 4.5, 0, Math.PI * 2);
      context.fillStyle = "#ff6a00";
      context.fill();
    };

    const draw = (now: number) => {
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);
      const streak = state === "playing" ? 10 + elapsed * 0.8 : 4;

      context.lineWidth = 1;

      for (const star of stars) {
        context.strokeStyle = `rgba(255, 170, 90, ${0.12 + star.depth * 0.35})`;
        context.beginPath();
        context.moveTo(star.x, star.y);
        context.lineTo(star.x, star.y - streak * star.depth);
        context.stroke();
      }

      hazards.forEach(drawPill);

      if (state !== "over") {
        drawShip(now);
      }

      context.globalCompositeOperation = "lighter";

      for (const spark of sparks) {
        context.globalAlpha = Math.max(0, spark.life);
        context.drawImage(glow, spark.x - 10, spark.y - 10, 20, 20);
      }

      context.globalAlpha = 1;
      context.globalCompositeOperation = "source-over";
    };

    const loop = (now: number) => {
      frame = window.requestAnimationFrame(loop);
      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;
      update(delta);
      draw(now);
    };

    const keyName = (event: KeyboardEvent) => {
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

      if (key === "ArrowLeft" || key === "a") return "left";
      if (key === "ArrowRight" || key === "d") return "right";
      return key;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = keyName(event);

      if (!["left", "right", " ", "Escape", "ArrowUp", "ArrowDown"].includes(key)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      if (key === "Escape") {
        onCloseRef.current();
      } else if (key === " ") {
        if (state !== "playing") {
          start();
        }
      } else if (key === "left" || key === "right") {
        held.add(key);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      held.delete(keyName(event));
    };

    const handlePointerMove = (event: PointerEvent) => {
      targetX = event.clientX;
    };

    const handlePointerDown = (event: PointerEvent) => {
      if ((event.target as HTMLElement).closest("button")) {
        return;
      }

      targetX = event.clientX;

      if (state !== "playing") {
        start();
      }
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    window.addEventListener("keyup", handleKeyUp, { capture: true });
    root.addEventListener("pointermove", handlePointerMove);
    root.addEventListener("pointerdown", handlePointerDown);
    frame = window.requestAnimationFrame(loop);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
      window.removeEventListener("keyup", handleKeyUp, { capture: true });
      root.removeEventListener("pointermove", handlePointerMove);
      root.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="egg-game is-ship-it"
      role="dialog"
      aria-label={copy.title}
      lang={locale}
    >
      <canvas ref={canvasRef} className="egg-game-canvas" aria-hidden="true" />
      <div className="egg-game-hud">
        <span className="egg-game-title">{copy.title}</span>
        <span>
          {copy.score} <strong>{score}</strong>
        </span>
        <span>
          {copy.best} <strong>{best}</strong>
        </span>
      </div>
      {banner ? (
        <p key={banner.key} className="egg-game-banner" role="status">
          {banner.text}
        </p>
      ) : null}
      {status !== "playing" ? (
        <div className="egg-game-message">
          <p className="egg-game-headline">
            {status === "over" ? copy.failed : copy.title}
          </p>
          {status === "ready" ? <p>{copy.tagline}</p> : null}
          <p>{status === "over" ? copy.restart : copy.start}</p>
          <p className="egg-game-controls">{copy.controls}</p>
        </div>
      ) : null}
      <button
        type="button"
        className="egg-game-close"
        aria-label={copy.close}
        onClick={onClose}
      >
        ×
      </button>
    </div>
  );
}
