"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import { streamChatAnswer } from "@/lib/chat-stream";
import { getDictionary } from "@/lib/dictionaries";
import {
  EGG_EVENTS,
  SECRET_IDS,
  emitEgg,
  getFoundSecrets,
  resolveParticleTheme,
  unlockSecret,
} from "@/lib/easter-eggs";
import {
  DULY_TESTFLIGHT_URL,
  DULY_URL,
  SALAH_NOW_URL,
  getExploreContent,
} from "@/lib/explore-content";
import { isLocale, localizePath, stripLocale, type Locale } from "@/lib/i18n";
import { socialLinks } from "@/lib/site";

type LineKind = "input" | "output" | "error" | "accent";

type Line = {
  id: number;
  kind: LineKind;
  text: string;
};

const PROMPT = "visitor@blcnyy.dev:~$";
const COMMAND_NAMES = [
  "help",
  "whoami",
  "about",
  "ls",
  "cat",
  "projects",
  "open",
  "ask",
  "theme",
  "party",
  "lang",
  "secrets",
  "echo",
  "date",
  "sudo",
  "clear",
  "exit",
];

const socialUrl = (label: string) =>
  socialLinks.find((link) => link.label === label)?.url ?? "";

// Ask answers arrive as Markdown; a terminal shows plain text.
const toPlainText = (markdown: string) =>
  markdown
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, text: string, url: string) =>
      text === url ? url : `${text} (${url})`,
    )
    .replace(/(\*\*|__)(.+?)\1/g, "$2")
    .replace(/(^|[^*\w])\*(?!\s)([^*\n]+?)\*(?!\w)/g, "$1$2")
    .replace(/`([^`\n]+)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^(\s*)[-*]\s+/gm, "$1• ");

export function Terminal({
  locale,
  onClose,
}: {
  locale: Locale;
  onClose: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const dictionary = getDictionary(locale);
  const copy = dictionary.eggs.terminal;
  const [lines, setLines] = useState<Line[]>(() => [
    { id: 0, kind: "accent", text: copy.welcome },
  ]);
  const [input, setInput] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const nextIdRef = useRef(1);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const timersRef = useRef<number[]>([]);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    unlockSecret("terminal");
    inputRef.current?.focus();
    const timers = timersRef.current;

    // Esc closes the terminal even when focus has moved elsewhere.
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
      }
    };

    window.addEventListener("keydown", closeOnEscape, { capture: true });

    return () => {
      window.removeEventListener("keydown", closeOnEscape, { capture: true });
      abortRef.current?.abort();
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [lines]);

  function clearScreen() {
    const id = nextIdRef.current;
    nextIdRef.current += 1;
    setLines([{ id, kind: "accent", text: copy.welcome }]);
  }

  function print(text: string, kind: LineKind = "output") {
    const id = nextIdRef.current;
    nextIdRef.current += 1;
    setLines((current) => [...current, { id, kind, text }]);
    return id;
  }

  function updateLine(id: number, text: string, kind?: LineKind) {
    setLines((current) =>
      current.map((line) =>
        line.id === id ? { ...line, text, kind: kind ?? line.kind } : line,
      ),
    );
  }

  function later(callback: () => void, delay: number) {
    timersRef.current.push(window.setTimeout(callback, delay));
  }

  function openTarget(target: string) {
    const internal: Record<string, string> = {
      blog: localizePath(locale, "/blog"),
      ask: localizePath(locale, "/ask"),
      home: localizePath(locale, "/"),
    };
    const external: Record<string, string> = {
      duly: DULY_URL,
      testflight: DULY_TESTFLIGHT_URL,
      salah: SALAH_NOW_URL,
      x: socialUrl("X"),
      instagram: socialUrl("Instagram"),
      youtube: socialUrl("YouTube"),
      github: socialUrl("GitHub"),
    };

    if (internal[target]) {
      print(copy.opening(target));
      later(() => {
        router.push(internal[target]);
        onClose();
      }, 400);
      return;
    }

    if (external[target]) {
      print(copy.opening(external[target]));
      window.open(external[target], "_blank", "noopener,noreferrer");
      return;
    }

    print(copy.openUsage, "error");
  }

  async function ask(question: string) {
    if (!question) {
      print(copy.askUsage, "error");
      return;
    }

    const id = print(copy.asking, "accent");
    const controller = new AbortController();
    abortRef.current = controller;
    setIsBusy(true);

    try {
      await streamChatAnswer({
        message: question,
        locale,
        signal: controller.signal,
        onText: (answer) => updateLine(id, toPlainText(answer), "output"),
      });
    } catch (error) {
      if (!controller.signal.aborted) {
        updateLine(
          id,
          error instanceof Error && error.message ? error.message : copy.askFailed,
          "error",
        );
      }
    } finally {
      abortRef.current = null;
      setIsBusy(false);
      inputRef.current?.focus();
    }
  }

  function showSecrets() {
    const found = getFoundSecrets();
    print(copy.secretsHeader(found.length, SECRET_IDS.length), "accent");

    for (const id of SECRET_IDS) {
      const secret = dictionary.eggs.secrets[id];
      print(
        found.includes(id)
          ? `  ✓ ${secret.name}`
          : `  · ${copy.secretLocked}  ${secret.hint}`,
      );
    }
  }

  function run(rawCommand: string) {
    const command = rawCommand.trim();
    print(`${PROMPT} ${command}`, "input");

    if (!command) {
      return;
    }

    historyRef.current = [command, ...historyRef.current].slice(0, 50);
    historyIndexRef.current = -1;

    const [name, ...args] = command.split(/\s+/);
    const argument = args.join(" ");

    switch (name.toLowerCase()) {
      case "help": {
        const width = Math.max(...copy.commands.map(([usage]) => usage.length));
        copy.commands.forEach(([usage, description]) =>
          print(`  ${usage.padEnd(width + 3)}${description}`),
        );
        break;
      }
      case "whoami":
        print(copy.whoami);
        break;
      case "about":
        print(copy.about);
        break;
      case "ls":
        if (args[0]?.startsWith("projects")) {
          print("duly/   salah-now/");
        } else if (args[0]?.startsWith("articles")) {
          openTarget("blog");
        } else {
          print(copy.ls);
        }
        break;
      case "cat":
        if (args[0] === "story.md") {
          const { story } = getExploreContent(locale);
          print(`# ${story.heading}`, "accent");
          print(story.body);
        } else if (args[0] === "secrets.txt") {
          print(copy.secretsFile);
        } else {
          print(copy.cat, "error");
        }
        break;
      case "projects":
        getExploreContent(locale).projects.forEach((project) => {
          print(`${project.name}  ${project.statement}`, "accent");
          project.links.forEach((link) => print(`  ↳ ${link.url}`));
        });
        break;
      case "open":
        openTarget(args[0]?.toLowerCase() ?? "");
        break;
      case "ask":
        void ask(argument);
        break;
      case "theme": {
        const result = argument ? resolveParticleTheme(argument) : null;

        if (result?.ok) {
          emitEgg(EGG_EVENTS.theme, result.theme);
          print(copy.themeSet(result.theme.name), "accent");
        } else if (result?.reason === "too-dark") {
          print(copy.themeTooDark, "error");
        } else {
          print(copy.themeUsage, "error");
        }
        break;
      }
      case "party":
        emitEgg(EGG_EVENTS.burst);
        print(copy.party, "accent");
        break;
      case "lang": {
        const target = args[0]?.toLowerCase();

        if (isLocale(target)) {
          router.push(localizePath(target, stripLocale(pathname)));
          onClose();
        } else {
          print(copy.langUsage, "error");
        }
        break;
      }
      case "secrets":
        showSecrets();
        break;
      case "echo":
        print(argument);
        break;
      case "date":
        print(new Date().toLocaleString(locale === "tr" ? "tr-TR" : "en-US"));
        break;
      case "sudo":
        if (/\brm\b/.test(argument) && /-\w*r\w*f|-\w*f\w*r/.test(argument)) {
          setIsBusy(true);
          copy.rmrf.forEach((line, index) =>
            later(() => print(line, "error"), 350 * (index + 1)),
          );
          later(() => {
            emitEgg(EGG_EVENTS.burst);
            print(copy.rmrfEnd, "accent");
            setIsBusy(false);
            inputRef.current?.focus();
          }, 350 * (copy.rmrf.length + 2));
        } else {
          print(copy.sudo, "error");
        }
        break;
      case "clear":
        clearScreen();
        break;
      case "exit":
        onClose();
        break;
      default:
        print(copy.notFound(name), "error");
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isBusy) {
      return;
    }

    run(input);
    setInput("");
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.ctrlKey && event.key.toLowerCase() === "c") {
      if (abortRef.current) {
        event.preventDefault();
        abortRef.current.abort();
        print("^C", "error");
      }
      return;
    }

    if (event.ctrlKey && event.key.toLowerCase() === "l") {
      event.preventDefault();
      clearScreen();
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      const matches = COMMAND_NAMES.filter((name) => name.startsWith(input.trim()));

      if (matches.length === 1) {
        setInput(`${matches[0]} `);
      } else if (matches.length > 1 && input.trim()) {
        print(matches.join("   "));
      }
      return;
    }

    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      const history = historyRef.current;
      const nextIndex =
        event.key === "ArrowUp"
          ? Math.min(historyIndexRef.current + 1, history.length - 1)
          : Math.max(historyIndexRef.current - 1, -1);

      historyIndexRef.current = nextIndex;
      setInput(nextIndex >= 0 ? history[nextIndex] : "");
    }
  }

  return (
    <div
      className="egg-terminal"
      role="dialog"
      aria-label={copy.title}
      lang={locale}
      onClick={() => inputRef.current?.focus()}
    >
      <div className="egg-terminal-bar">
        <span className="egg-terminal-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span className="egg-terminal-title">{copy.title}</span>
        <button
          type="button"
          className="egg-terminal-close"
          aria-label={copy.close}
          onClick={onClose}
        >
          ×
        </button>
      </div>
      <div ref={bodyRef} className="egg-terminal-body" role="log">
        {lines.map((line) => (
          <p key={line.id} className={`egg-terminal-line is-${line.kind}`}>
            {line.text}
          </p>
        ))}
        <form className="egg-terminal-input-row" onSubmit={handleSubmit}>
          <label htmlFor="egg-terminal-input" className="egg-terminal-prompt">
            {PROMPT}
          </label>
          <input
            ref={inputRef}
            id="egg-terminal-input"
            className="egg-terminal-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            readOnly={isBusy}
          />
        </form>
      </div>
    </div>
  );
}
