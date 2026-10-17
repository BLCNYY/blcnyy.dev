"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ShipItGame } from "@/components/easter-eggs/ship-it-game";
import { SnakeGame } from "@/components/easter-eggs/snake-game";
import { Terminal } from "@/components/easter-eggs/terminal";
import { getDictionary } from "@/lib/dictionaries";
import {
  EGG_EVENTS,
  SECRET_IDS,
  type SecretId,
  emitEgg,
  getFoundSecrets,
  isEditableTarget,
  onEgg,
  unlockSecret,
  useFoundSecrets,
} from "@/lib/easter-eggs";
import { getLocaleFromPath, type Locale } from "@/lib/i18n";

type Overlay = "terminal" | "snake" | "ship-it" | null;

const KONAMI = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];
const SPELL_WORD = "blcnyy";
const SHIFT_TAPS = 3;
const SHIFT_WINDOW_MS = 1000;

const ASCII_LOGO = String.raw`
 ____  _     ____ _   ___   ____   __
| __ )| |   / ___| \ | \ \ / /\ \ / /
|  _ \| |  | |   |  \| |\ V /  \ V /
| |_) | |__| |___| |\  | | |    | |
|____/|_____\____|_| \_| |_|    |_|
`;

let greeted = false;

function greetDevelopers(locale: Locale) {
  if (greeted) {
    return;
  }

  greeted = true;
  const copy = getDictionary(locale).eggs.console;

  console.log(
    `%c${ASCII_LOGO}`,
    "color:#ff7a00;font-family:monospace;font-weight:700;line-height:1.1",
  );
  console.log(
    `%c${copy.greeting}%c\n${copy.hint}`,
    "color:#ffffff;background:#ff6a00;padding:4px 10px;border-radius:999px;font-weight:700",
    "color:#ff9a1f;font-family:monospace;padding-top:6px",
  );
}

function installConsoleApi(locale: Locale) {
  const copy = getDictionary(locale).eggs;
  const discover = () => unlockSecret("console");

  const api = {
    help() {
      discover();
      copy.console.commands.forEach(([command, description]) =>
        console.log(
          `%c${command.padEnd(20)}%c${description}`,
          "color:#ff9a1f;font-family:monospace",
          "color:inherit",
        ),
      );
      console.log(`%c${copy.console.tip}`, "color:#999999;font-style:italic");
    },
    terminal() {
      discover();
      emitEgg(EGG_EVENTS.openTerminal);
    },
    party() {
      discover();
      emitEgg(EGG_EVENTS.burst);
      return "🎉";
    },
    secrets() {
      discover();
      const found = getFoundSecrets();
      console.log(
        `%c${copy.console.secretsHeader(found.length, SECRET_IDS.length)}`,
        "color:#ff9a1f;font-weight:700",
      );
      SECRET_IDS.forEach((id) =>
        console.log(
          found.includes(id)
            ? `✓ ${copy.secrets[id].name}`
            : `· ??? ${copy.secrets[id].hint}`,
        ),
      );
    },
  };

  Object.defineProperty(window, "blcnyy", {
    value: api,
    configurable: true,
  });
}

function SecretToast({ locale, secret }: { locale: Locale; secret: SecretId }) {
  const copy = getDictionary(locale).eggs;
  const found = useFoundSecrets();

  return (
    <div className="egg-toast" role="status" lang={locale}>
      <span className="egg-toast-icon" aria-hidden="true">
        🥚
      </span>
      <span>
        <strong>{copy.secretFound}</strong> · {copy.secrets[secret].name}
      </span>
      <span className="egg-toast-count">
        {found.length}/{SECRET_IDS.length}
      </span>
    </div>
  );
}

export function EasterEggs() {
  const locale = getLocaleFromPath(usePathname());
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [toast, setToast] = useState<{ id: SecretId; key: number } | null>(null);
  const overlayRef = useRef<Overlay>(null);

  useEffect(() => {
    overlayRef.current = overlay;
  }, [overlay]);

  useEffect(() => {
    greetDevelopers(locale);
    installConsoleApi(locale);
  }, [locale]);

  useEffect(() => {
    let shiftTaps: number[] = [];
    let recentKeys: string[] = [];
    let typed = "";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (overlayRef.current || isEditableTarget(event.target)) {
        shiftTaps = [];
        return;
      }

      const key = event.key;

      if (key === "Shift") {
        if (event.repeat) {
          return;
        }

        const now = performance.now();
        shiftTaps = [...shiftTaps.filter((time) => now - time < SHIFT_WINDOW_MS), now];

        if (shiftTaps.length >= SHIFT_TAPS) {
          shiftTaps = [];
          setOverlay("terminal");
        }
        return;
      }

      shiftTaps = [];
      recentKeys = [...recentKeys, key.length === 1 ? key.toLowerCase() : key].slice(
        -KONAMI.length,
      );

      if (KONAMI.every((expected, index) => recentKeys[index] === expected)) {
        recentKeys = [];
        event.preventDefault();
        setOverlay("snake");
        return;
      }

      if (/^[a-z]$/i.test(key) && !event.metaKey && !event.ctrlKey && !event.altKey) {
        typed = (typed + key.toLowerCase()).slice(-SPELL_WORD.length);

        if (typed === SPELL_WORD && document.querySelector(".explore-backdrop")) {
          typed = "";
          emitEgg(EGG_EVENTS.spell);
          unlockSecret("spell");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const stopTerminal = onEgg(EGG_EVENTS.openTerminal, () => setOverlay("terminal"));
    const stopShipIt = onEgg(EGG_EVENTS.shipIt, () => setOverlay("ship-it"));
    const stopSecret = onEgg<SecretId>(EGG_EVENTS.secret, (id) =>
      setToast({ id, key: Date.now() }),
    );

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      stopTerminal();
      stopShipIt();
      stopSecret();
    };
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), 3800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const close = () => setOverlay(null);

  return (
    <>
      {overlay === "terminal" ? <Terminal locale={locale} onClose={close} /> : null}
      {overlay === "snake" ? <SnakeGame locale={locale} onClose={close} /> : null}
      {overlay === "ship-it" ? <ShipItGame locale={locale} onClose={close} /> : null}
      {toast ? <SecretToast key={toast.key} locale={locale} secret={toast.id} /> : null}
    </>
  );
}
