"use client";

import { useRouter } from "next/navigation";
import {
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import { getDictionary } from "@/lib/dictionaries";
import { unlockSecret } from "@/lib/easter-eggs";
import { localizePath, type Locale } from "@/lib/i18n";

const PAGE_WIDTH = 56;
const PAGE_HEIGHT = 72;
const FLEE_DISTANCE = 120;
// The page gets tired after a while so everyone can catch it eventually.
const TIRED_AFTER = 8;
const ASLEEP_AFTER = 14;

type Position = { x: number; y: number };

function arenaBounds(arena: HTMLDivElement | null) {
  return {
    width: Math.max(0, (arena?.clientWidth ?? 0) - PAGE_WIDTH),
    height: Math.max(0, (arena?.clientHeight ?? 0) - PAGE_HEIGHT - 22),
  };
}

export function RunawayPage({ locale }: { locale: Locale }) {
  const router = useRouter();
  const copy = getDictionary(locale).eggs.runaway;
  const arenaRef = useRef<HTMLDivElement>(null);
  const fleesRef = useRef(0);
  const [position, setPosition] = useState<Position | null>(null);
  const [isCaught, setIsCaught] = useState(false);
  const [mood, setMood] = useState<"awake" | "tired" | "asleep">("awake");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const { width, height } = arenaBounds(arenaRef.current);
      setPosition({ x: width / 2, y: height / 2 });
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  // Without a mouse, the page hops around on its own until it is tapped.
  useEffect(() => {
    if (isCaught || window.matchMedia("(hover: hover)").matches) {
      return;
    }

    const timer = window.setInterval(() => {
      const { width, height } = arenaBounds(arenaRef.current);
      setPosition({ x: Math.random() * width, y: Math.random() * height });
    }, 1100);
    return () => window.clearInterval(timer);
  }, [isCaught]);

  const flee = (event: ReactPointerEvent<HTMLDivElement>) => {
    const arena = arenaRef.current;

    if (!arena || !position || isCaught || event.pointerType !== "mouse") {
      return;
    }

    const flees = fleesRef.current;

    if (flees >= ASLEEP_AFTER) {
      return;
    }

    const rect = arena.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;
    const centerX = position.x + PAGE_WIDTH / 2;
    const centerY = position.y + PAGE_HEIGHT / 2;
    const dx = centerX - pointerX;
    const dy = centerY - pointerY;
    const distance = Math.hypot(dx, dy) || 1;

    if (distance > FLEE_DISTANCE) {
      return;
    }

    const tired = flees >= TIRED_AFTER;
    const jump = (tired ? 50 : 150) + Math.random() * 40;
    const { width, height } = arenaBounds(arena);
    let next = {
      x: position.x + (dx / distance) * jump + (Math.random() - 0.5) * 60,
      y: position.y + (dy / distance) * jump + (Math.random() - 0.5) * 60,
    };
    const cornered =
      next.x < 0 || next.y < 0 || next.x > width || next.y > height;

    if (cornered) {
      // Slip past the cursor to the far side instead of hugging a wall.
      next = {
        x: pointerX < rect.width / 2 ? width * (0.6 + Math.random() * 0.4) : width * Math.random() * 0.4,
        y: Math.random() * height,
      };
    }

    fleesRef.current = flees + 1;
    setMood(
      flees + 1 >= ASLEEP_AFTER ? "asleep" : flees + 1 >= TIRED_AFTER ? "tired" : "awake",
    );
    setPosition({
      x: Math.min(Math.max(next.x, 0), width),
      y: Math.min(Math.max(next.y, 0), height),
    });
  };

  const catchPage = () => {
    if (isCaught) {
      return;
    }

    setIsCaught(true);
    unlockSecret("runaway-page");
    window.setTimeout(() => router.push(localizePath(locale, "/")), 1500);
  };

  return (
    <div className="runaway">
      <p className="runaway-prompt">{isCaught ? copy.caught : copy.prompt}</p>
      <div ref={arenaRef} className="runaway-arena" onPointerMove={flee}>
        {position ? (
          <button
            type="button"
            className={`runaway-page is-${isCaught ? "caught" : mood}`}
            style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
            onPointerDown={catchPage}
            aria-label={copy.label}
          >
            <span className="runaway-sheet" aria-hidden="true">
              <span className="runaway-eyes">
                <span />
                <span />
              </span>
              {mood === "asleep" && !isCaught ? (
                <span className="runaway-zzz">z z</span>
              ) : null}
            </span>
            <span className="runaway-label" aria-hidden="true">
              {copy.label}
            </span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
