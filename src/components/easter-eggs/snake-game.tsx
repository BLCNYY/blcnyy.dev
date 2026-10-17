"use client";

import { useEffect, useRef, useState } from "react";

import { createGlowSprite, readBest, saveBest } from "@/components/easter-eggs/game-utils";
import { getDictionary } from "@/lib/dictionaries";
import { unlockSecret } from "@/lib/easter-eggs";
import type { Locale } from "@/lib/i18n";

type Cell = { x: number; y: number };
type Status = "ready" | "playing" | "over";

const CELL = 22;
const BEST_KEY = "blcnyy:snake-best";
const DIRECTIONS: Record<string, Cell> = {
  ArrowUp: { x: 0, y: -1 },
  w: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  s: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  a: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  d: { x: 1, y: 0 },
};

export function SnakeGame({
  locale,
  onClose,
}: {
  locale: Locale;
  onClose: () => void;
}) {
  const dictionary = getDictionary(locale);
  const copy = dictionary.eggs.snake;
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onCloseRef = useRef(onClose);
  const [status, setStatus] = useState<Status>("ready");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => readBest(BEST_KEY));

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    unlockSecret("snake");

    const root = rootRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!root || !canvas || !context) {
      return;
    }

    const body = createGlowSprite("255, 122, 0");
    const head = createGlowSprite("255, 196, 110");
    let dpr = 1;
    let cols = 20;
    let rows = 14;
    let offsetX = 0;
    let offsetY = 0;
    let snake: Cell[] = [];
    let direction: Cell = { x: 1, y: 0 };
    let queued: Cell[] = [];
    let food: Cell = { x: 0, y: 0 };
    let currentScore = 0;
    let state: Status = "ready";
    let accumulator = 0;
    let last = performance.now();
    let frame = 0;
    let swipeStart: Cell | null = null;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      cols = Math.max(10, Math.floor((width - 48) / CELL));
      rows = Math.max(8, Math.floor((height - 190) / CELL));
      offsetX = (width - cols * CELL) / 2;
      offsetY = 120 + (height - 190 - rows * CELL) / 2;
    };

    const placeFood = () => {
      do {
        food = {
          x: Math.floor(Math.random() * cols),
          y: Math.floor(Math.random() * rows),
        };
      } while (snake.some((part) => part.x === food.x && part.y === food.y));
    };

    const reset = () => {
      const x = Math.floor(cols / 3);
      const y = Math.floor(rows / 2);
      snake = [
        { x, y },
        { x: x - 1, y },
        { x: x - 2, y },
      ];
      direction = { x: 1, y: 0 };
      queued = [];
      currentScore = 0;
      accumulator = 0;
      setScore(0);
      placeFood();
    };

    const start = () => {
      reset();
      state = "playing";
      setStatus("playing");
    };

    const end = () => {
      state = "over";
      setStatus("over");
      setBest((previous) => {
        const next = Math.max(previous, currentScore);
        saveBest(BEST_KEY, next);
        return next;
      });
    };

    const turn = (next: Cell) => {
      const latest = queued[queued.length - 1] ?? direction;

      if (
        (next.x === -latest.x && next.y === -latest.y) ||
        (next.x === latest.x && next.y === latest.y) ||
        queued.length >= 3
      ) {
        return;
      }

      queued.push(next);
    };

    const step = () => {
      direction = queued.shift() ?? direction;
      const nextHead = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

      if (
        nextHead.x < 0 ||
        nextHead.y < 0 ||
        nextHead.x >= cols ||
        nextHead.y >= rows ||
        snake.some((part) => part.x === nextHead.x && part.y === nextHead.y)
      ) {
        end();
        return;
      }

      snake.unshift(nextHead);

      if (nextHead.x === food.x && nextHead.y === food.y) {
        currentScore += 10;
        setScore(currentScore);
        placeFood();
      } else {
        snake.pop();
      }
    };

    const drawGlow = (
      sprite: HTMLCanvasElement,
      cell: Cell,
      size: number,
      alpha: number,
    ) => {
      const x = (offsetX + cell.x * CELL + CELL / 2) * dpr;
      const y = (offsetY + cell.y * CELL + CELL / 2) * dpr;
      const scaled = size * dpr;
      context.globalAlpha = alpha;
      context.drawImage(sprite, x - scaled / 2, y - scaled / 2, scaled, scaled);
    };

    const draw = (now: number) => {
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.globalCompositeOperation = "source-over";
      context.globalAlpha = 1;
      context.strokeStyle = "rgba(255, 255, 255, 0.1)";
      context.lineWidth = dpr;
      context.strokeRect(
        offsetX * dpr,
        offsetY * dpr,
        cols * CELL * dpr,
        rows * CELL * dpr,
      );
      context.globalCompositeOperation = "lighter";
      drawGlow(head, food, CELL * (1.7 + Math.sin(now / 160) * 0.25), 1);
      snake.forEach((part, index) =>
        drawGlow(
          index === 0 ? head : body,
          part,
          CELL * (index === 0 ? 1.6 : 1.3),
          Math.max(0.4, 1 - index * 0.025),
        ),
      );
      context.globalAlpha = 1;
      context.globalCompositeOperation = "source-over";
    };

    const loop = (now: number) => {
      frame = window.requestAnimationFrame(loop);
      const delta = Math.min(now - last, 100);
      last = now;

      if (state === "playing") {
        accumulator += delta;
        const interval = Math.max(60, 120 - currentScore * 0.6);

        while (accumulator >= interval && state === "playing") {
          accumulator -= interval;
          step();
        }
      }

      draw(now);
    };

    const handleKey = (event: KeyboardEvent) => {
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      const next = DIRECTIONS[key];

      if (key !== "Escape" && key !== " " && !next) {
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
      } else if (next && state === "playing") {
        turn(next);
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      if ((event.target as HTMLElement).closest("button")) {
        return;
      }

      if (state !== "playing") {
        start();
        return;
      }

      swipeStart = { x: event.clientX, y: event.clientY };
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (!swipeStart || state !== "playing") {
        return;
      }

      const dx = event.clientX - swipeStart.x;
      const dy = event.clientY - swipeStart.y;
      swipeStart = null;

      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) {
        return;
      }

      turn(
        Math.abs(dx) > Math.abs(dy)
          ? { x: Math.sign(dx), y: 0 }
          : { x: 0, y: Math.sign(dy) },
      );
    };

    resize();
    reset();
    window.addEventListener("resize", resize);
    window.addEventListener("keydown", handleKey, { capture: true });
    root.addEventListener("pointerdown", handlePointerDown);
    root.addEventListener("pointerup", handlePointerUp);
    frame = window.requestAnimationFrame(loop);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", handleKey, { capture: true });
      root.removeEventListener("pointerdown", handlePointerDown);
      root.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="egg-game"
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
      {status !== "playing" ? (
        <div className="egg-game-message">
          <p className="egg-game-headline">
            {status === "over" ? copy.gameOver : copy.title}
          </p>
          <p>{status === "over" ? copy.restart : copy.start}</p>
          <p className="egg-game-controls">{copy.controls}</p>
        </div>
      ) : null}
      <button
        type="button"
        className="egg-game-close"
        aria-label={dictionary.eggs.shipIt.close}
        onClick={onClose}
      >
        ×
      </button>
    </div>
  );
}
