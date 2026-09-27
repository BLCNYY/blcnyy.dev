"use client";

import Image from "next/image";
import { FormEvent, useEffect, useRef, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { MAX_CHAT_MESSAGE_LENGTH } from "@/lib/limits";

type ChatResponse = {
  answer?: string;
  error?: string;
};

type ChatStreamEvent =
  | {
      type: "text" | "error" | "done";
      data: string;
    }
  | null;

type SearchHistoryEntry = {
  question: string;
  answer: string;
  createdAt: number;
};

type SelectionAction = {
  text: string;
  x: number;
  y: number;
};

type SpeechStatus = "idle" | "loading" | "playing";

type SpeechErrorResponse = {
  error?: string;
};

type CachedSpeechAudio = {
  url: string;
};

type PersistedSpeechAudio = {
  answer: string;
  blob: Blob;
  createdAt: number;
};

type BrowserSpeechRecognitionAlternative = {
  transcript?: string;
};

type BrowserSpeechRecognitionResult = {
  isFinal: boolean;
  [index: number]: BrowserSpeechRecognitionAlternative | undefined;
};

type BrowserSpeechRecognitionEvent = Event & {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: BrowserSpeechRecognitionResult | undefined;
  };
};

type BrowserSpeechRecognitionErrorEvent = Event & {
  error?: string;
  message?: string;
};

type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  abort: () => void;
  start: () => void;
  stop: () => void;
  onend: (() => void) | null;
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onstart: (() => void) | null;
};

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

type SpeechRecognitionWindow = Window & {
  SpeechRecognition?: BrowserSpeechRecognitionConstructor;
  webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
};

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function MicIcon({ isActive = false }: { isActive?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`h-4 w-4 shrink-0 ${isActive ? "animate-pulse" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z" />
      <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
      <path d="M12 18v3" />
      <path d="M8 21h8" />
    </svg>
  );
}

function SpeakerIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="M16 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 6a8.5 8.5 0 0 1 0 12" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 5v14" />
      <path d="M15 5v14" />
    </svg>
  );
}

function LoadingIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0 animate-spin"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3a9 9 0 1 0 9 9" />
    </svg>
  );
}

function RemoveIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 6 18 18" />
      <path d="M18 6 6 18" />
    </svg>
  );
}

const RETURNING_USER_STORAGE_KEY = "ask-blcnyy:returning-user";
const SEARCH_HISTORY_STORAGE_KEY = "ask-blcnyy:search-history";
const MAX_HISTORY_ITEMS = 5;
const MAX_SPEECH_CACHE_ITEMS = 5;
const SPEECH_CACHE_DB_NAME = "ask-blcnyy:speech-cache";
const SPEECH_CACHE_DB_VERSION = 1;
const SPEECH_CACHE_STORE_NAME = "speech-audio";
const GITHUB_AVATAR_URL = "https://github.com/BLCNYY.png?size=160";
const MARKDOWN_REMARK_PLUGINS = [remarkGfm];

const answerMarkdownComponents: Components = {
  p({ children }) {
    return <p className="mb-4 last:mb-0">{children}</p>;
  },
  strong({ children }) {
    return <strong className="font-bold tracking-[0.01em] text-white">{children}</strong>;
  },
  em({ children }) {
    return <em className="text-white/92">{children}</em>;
  },
  a({ children, href, title }) {
    return (
      <a
        href={href}
        title={title}
        target="_blank"
        rel="noreferrer"
        className="underline decoration-white/35 underline-offset-4 transition hover:decoration-white"
      >
        {children}
      </a>
    );
  },
  ul({ children }) {
    return (
      <ul className="my-5 list-disc space-y-2 pl-7 marker:text-white/45">
        {children}
      </ul>
    );
  },
  ol({ children }) {
    return (
      <ol className="my-5 list-decimal space-y-2 pl-7 marker:text-white/45">
        {children}
      </ol>
    );
  },
  li({ children }) {
    return <li className="pl-1">{children}</li>;
  },
  h1({ children }) {
    return (
      <h2 className="mb-4 mt-2 text-3xl font-bold tracking-[-0.02em] text-white">
        {children}
      </h2>
    );
  },
  h2({ children }) {
    return (
      <h2 className="mb-4 mt-2 text-2xl font-bold tracking-[-0.015em] text-white">
        {children}
      </h2>
    );
  },
  h3({ children }) {
    return (
      <h3 className="mb-3 mt-5 text-xl font-bold tracking-[-0.01em] text-white">
        {children}
      </h3>
    );
  },
  blockquote({ children }) {
    return (
      <blockquote className="my-5 border-l border-white/25 pl-5 text-white/72">
        {children}
      </blockquote>
    );
  },
  code({ children }) {
    return (
      <code className="rounded-md border border-white/10 bg-white/8 px-1.5 py-0.5 text-[0.9em] text-white/88">
        {children}
      </code>
    );
  },
  pre({ children }) {
    return (
      <pre className="my-5 overflow-x-auto rounded-2xl border border-white/10 bg-black/35 p-4 text-base leading-7 text-white/85">
        {children}
      </pre>
    );
  },
  table({ children }) {
    return (
      <div className="my-5 overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full border-collapse text-left text-base leading-7">
          {children}
        </table>
      </div>
    );
  },
  th({ children }) {
    return (
      <th className="border-b border-white/10 bg-white/8 px-4 py-3 font-bold text-white">
        {children}
      </th>
    );
  },
  td({ children }) {
    return <td className="border-t border-white/8 px-4 py-3">{children}</td>;
  },
};

function FormattedAnswer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={answerMarkdownComponents}
      remarkPlugins={MARKDOWN_REMARK_PLUGINS}
    >
      {content}
    </ReactMarkdown>
  );
}

function getLatestSearchHistoryItems(entries: SearchHistoryEntry[]) {
  return [...entries]
    .sort(
      (firstEntry, secondEntry) => secondEntry.createdAt - firstEntry.createdAt,
    )
    .slice(0, MAX_HISTORY_ITEMS);
}

function getSelectionAction(
  selectionRoot: HTMLElement | null,
): SelectionAction | null {
  const selection = window.getSelection();
  const selectedText = selection?.toString().replace(/\s+/g, " ").trim() ?? "";

  if (!selection || selection.isCollapsed || !selectedText) {
    return null;
  }

  const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

  if (
    !selectionRoot ||
    !range ||
    !selectionRoot.contains(range.commonAncestorContainer)
  ) {
    return null;
  }

  const rect = range.getBoundingClientRect();

  if (!rect || (rect.width === 0 && rect.height === 0)) {
    return null;
  }

  return {
    text: selectedText,
    x: Math.min(
      Math.max(rect.left + rect.width / 2, 72),
      window.innerWidth - 72,
    ),
    y: Math.max(rect.top - 44, 18),
  };
}

function getSpeechRecognitionConstructor() {
  if (typeof window === "undefined") {
    return null;
  }

  const speechWindow = window as SpeechRecognitionWindow;

  return (
    speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null
  );
}

function getDictationErrorMessage(error?: string) {
  if (error === "not-allowed" || error === "service-not-allowed") {
    return "Microphone access is blocked. Allow microphone access to dictate.";
  }

  if (error === "no-speech") {
    return "I didn't catch any speech. Try the mic again.";
  }

  if (error === "network") {
    return "Dictation needs a working speech recognition connection.";
  }

  return "Dictation is unavailable in this browser right now.";
}

function readSearchHistory(): SearchHistoryEntry[] {
  try {
    const rawValue = window.localStorage.getItem(SEARCH_HISTORY_STORAGE_KEY);

    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    const validEntries = parsedValue.filter(
      (item): item is SearchHistoryEntry => {
        if (typeof item !== "object" || item === null) {
          return false;
        }

        return (
          "question" in item &&
          typeof item.question === "string" &&
          item.question.trim().length > 0 &&
          "answer" in item &&
          typeof item.answer === "string" &&
          item.answer.trim().length > 0 &&
          "createdAt" in item &&
          typeof item.createdAt === "number"
        );
      },
    );

    return getLatestSearchHistoryItems(validEntries);
  } catch {
    return [];
  }
}

function parseStreamEvent(rawEvent: string): ChatStreamEvent {
  const lines = rawEvent.split(/\r?\n/);
  const eventType =
    lines.find((line) => line.startsWith("event:"))?.slice(6).trim() ?? "text";
  const data = lines
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart())
    .join("\n");

  if (!data) {
    return null;
  }

  if (
    eventType !== "text" &&
    eventType !== "error" &&
    eventType !== "done"
  ) {
    return null;
  }

  try {
    return {
      type: eventType,
      data: JSON.parse(data) as string,
    };
  } catch {
    return null;
  }
}

function writeAsciiString(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

function wrapPcmInWav(pcmBuffer: ArrayBuffer, sampleRate = 24000) {
  const dataLength = pcmBuffer.byteLength;
  const wavBuffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(wavBuffer);

  writeAsciiString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeAsciiString(view, 8, "WAVE");
  writeAsciiString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAsciiString(view, 36, "data");
  view.setUint32(40, dataLength, true);
  new Uint8Array(wavBuffer, 44).set(new Uint8Array(pcmBuffer));

  return new Blob([wavBuffer], { type: "audio/wav" });
}

function openSpeechCacheDb() {
  return new Promise<IDBDatabase | null>((resolve) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      resolve(null);
      return;
    }

    const request = window.indexedDB.open(
      SPEECH_CACHE_DB_NAME,
      SPEECH_CACHE_DB_VERSION,
    );

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(SPEECH_CACHE_STORE_NAME)) {
        const store = db.createObjectStore(SPEECH_CACHE_STORE_NAME, {
          keyPath: "answer",
        });
        store.createIndex("createdAt", "createdAt");
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });
}

async function readPersistedSpeechAudio(answer: string) {
  const db = await openSpeechCacheDb();

  if (!db) {
    return null;
  }

  return new Promise<Blob | null>((resolve) => {
    const transaction = db.transaction(SPEECH_CACHE_STORE_NAME, "readonly");
    const request = transaction.objectStore(SPEECH_CACHE_STORE_NAME).get(answer);

    request.onsuccess = () => {
      const record = request.result as PersistedSpeechAudio | undefined;
      resolve(record?.blob ?? null);
    };
    request.onerror = () => resolve(null);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      resolve(null);
    };
  });
}

async function writePersistedSpeechAudio(answer: string, blob: Blob) {
  const db = await openSpeechCacheDb();

  if (!db) {
    return;
  }

  await new Promise<void>((resolve) => {
    const transaction = db.transaction(SPEECH_CACHE_STORE_NAME, "readwrite");
    const store = transaction.objectStore(SPEECH_CACHE_STORE_NAME);

    store.put({
      answer,
      blob,
      createdAt: Date.now(),
    } satisfies PersistedSpeechAudio);

    const allRecordsRequest = store.index("createdAt").getAll();

    allRecordsRequest.onsuccess = () => {
      const oldRecords = (allRecordsRequest.result as PersistedSpeechAudio[])
        .sort((firstRecord, secondRecord) => {
          return secondRecord.createdAt - firstRecord.createdAt;
        })
        .slice(MAX_SPEECH_CACHE_ITEMS);

      oldRecords.forEach((record) => {
        store.delete(record.answer);
      });
    };

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      resolve();
    };
  });
}

async function deletePersistedSpeechAudio(answer: string) {
  const db = await openSpeechCacheDb();

  if (!db) {
    return;
  }

  await new Promise<void>((resolve) => {
    const transaction = db.transaction(SPEECH_CACHE_STORE_NAME, "readwrite");
    transaction.objectStore(SPEECH_CACHE_STORE_NAME).delete(answer);
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      resolve();
    };
  });
}

export function ChatShell() {
  const [prompt, setPrompt] = useState("");
  const [submittedPrompt, setSubmittedPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryEntry[]>([]);
  const [cachedAnswerQuestion, setCachedAnswerQuestion] = useState("");
  const [selectionAction, setSelectionAction] =
    useState<SelectionAction | null>(null);
  const [dictationError, setDictationError] = useState("");
  const [isDictating, setIsDictating] = useState(false);
  const [speechStatus, setSpeechStatus] = useState<SpeechStatus>("idle");
  const [speechError, setSpeechError] = useState("");
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const answerRef = useRef<HTMLDivElement | null>(null);
  const dictationBasePromptRef = useRef("");
  const finalTranscriptRef = useRef("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef("");
  const spokenAnswerRef = useRef("");
  const speechCacheRef = useRef<Map<string, CachedSpeechAudio>>(new Map());

  const showResult = isLoading || Boolean(answer) || Boolean(error);
  const visibleSearchHistory = getLatestSearchHistoryItems(searchHistory);
  const showSearchHistory =
    !showResult && isReturningUser && visibleSearchHistory.length > 0;
  const dictationStatus = dictationError || (isDictating ? "Listening..." : "");

  function clearSpeechAudio() {
    audioRef.current?.pause();
    audioRef.current = null;
    spokenAnswerRef.current = "";
    audioUrlRef.current = "";
  }

  function removeCachedSpeechAudio(speechText: string) {
    const cachedAudio = speechCacheRef.current.get(speechText);

    if (cachedAudio) {
      URL.revokeObjectURL(cachedAudio.url);
      speechCacheRef.current.delete(speechText);
    }
  }

  function cacheSpeechAudio(speechText: string, audioUrl: string) {
    removeCachedSpeechAudio(speechText);
    speechCacheRef.current.set(speechText, { url: audioUrl });

    while (speechCacheRef.current.size > MAX_SPEECH_CACHE_ITEMS) {
      const oldestKey = speechCacheRef.current.keys().next().value;

      if (!oldestKey) {
        break;
      }

      removeCachedSpeechAudio(oldestKey);
    }
  }

  useEffect(() => {
    const hasVisitedBefore =
      window.localStorage.getItem(RETURNING_USER_STORAGE_KEY) === "true";
    const storedHistory = readSearchHistory();
    const timeoutId = window.setTimeout(() => {
      setIsReturningUser(hasVisitedBefore);
      setSearchHistory(storedHistory);
    }, 0);

    try {
      window.localStorage.setItem(RETURNING_USER_STORAGE_KEY, "true");
    } catch {}

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    function updateSelectionAction() {
      setSelectionAction(getSelectionAction(answerRef.current));
    }

    function scheduleSelectionUpdate() {
      window.setTimeout(updateSelectionAction, 0);
    }

    function hideSelectionActionOnPointerDown(event: PointerEvent) {
      const target = event.target;

      if (
        target instanceof Element &&
        target.closest("[data-selection-action]")
      ) {
        return;
      }

      setSelectionAction(null);
    }

    window.addEventListener("pointerdown", hideSelectionActionOnPointerDown);
    window.addEventListener("pointerup", scheduleSelectionUpdate);
    window.addEventListener("keyup", scheduleSelectionUpdate);
    window.addEventListener("resize", updateSelectionAction);
    window.addEventListener("scroll", updateSelectionAction, true);

    return () => {
      window.removeEventListener(
        "pointerdown",
        hideSelectionActionOnPointerDown,
      );
      window.removeEventListener("pointerup", scheduleSelectionUpdate);
      window.removeEventListener("keyup", scheduleSelectionUpdate);
      window.removeEventListener("resize", updateSelectionAction);
      window.removeEventListener("scroll", updateSelectionAction, true);
    };
  }, [isLoading]);

  useEffect(() => {
    const speechCache = speechCacheRef.current;

    return () => {
      recognitionRef.current?.abort();
      audioRef.current?.pause();
      audioRef.current = null;
      spokenAnswerRef.current = "";
      audioUrlRef.current = "";
      speechCache.forEach((cachedAudio) => {
        URL.revokeObjectURL(cachedAudio.url);
      });
      speechCache.clear();
    };
  }, []);

  useEffect(() => {
    if (spokenAnswerRef.current && spokenAnswerRef.current !== answer) {
      clearSpeechAudio();
      setSpeechStatus("idle");
      setSpeechError("");
    }
  }, [answer]);

  function storeSearchHistory(question: string, savedAnswer: string) {
    setSearchHistory((currentHistory) => {
      const historyEntry: SearchHistoryEntry = {
        question,
        answer: savedAnswer,
        createdAt: Date.now(),
      };
      const nextHistory = [
        historyEntry,
        ...currentHistory.filter((entry) => entry.question !== question),
      ].slice(0, MAX_HISTORY_ITEMS);

      try {
        window.localStorage.setItem(
          SEARCH_HISTORY_STORAGE_KEY,
          JSON.stringify(nextHistory),
        );
      } catch {}

      return nextHistory;
    });
  }

  function removeSearchHistoryEntry(question: string) {
    setSearchHistory((currentHistory) => {
      const removedEntry = currentHistory.find(
        (entry) => entry.question === question,
      );
      const nextHistory = getLatestSearchHistoryItems(
        currentHistory.filter((entry) => entry.question !== question),
      );

      try {
        if (nextHistory.length) {
          window.localStorage.setItem(
            SEARCH_HISTORY_STORAGE_KEY,
            JSON.stringify(nextHistory),
          );
        } else {
          window.localStorage.removeItem(SEARCH_HISTORY_STORAGE_KEY);
        }
      } catch {}

      if (removedEntry) {
        removeCachedSpeechAudio(removedEntry.answer);
        void deletePersistedSpeechAudio(removedEntry.answer);
      }

      return nextHistory;
    });
  }

  function showSavedHistoryEntry(entry: SearchHistoryEntry) {
    if (isLoading) {
      return;
    }

    setSubmittedPrompt(entry.question);
    setAnswer(entry.answer);
    setError("");
    setPrompt("");
    setCachedAnswerQuestion(entry.question);
  }

  async function submitMessage(rawMessage: string) {
    const message = rawMessage.trim();

    if (!message || isLoading) {
      return;
    }

    setIsLoading(true);
    setSubmittedPrompt(message);
    setAnswer("");
    setError("");
    setPrompt("");
    setCachedAnswerQuestion("");
    setSelectionAction(null);
    setDictationError("");
    setSpeechError("");
    setSpeechStatus("idle");
    clearSpeechAudio();
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsDictating(false);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      const contentType = response.headers.get("content-type") ?? "";

      if (contentType.includes("application/json")) {
        let data: ChatResponse | null = null;

        try {
          data = (await response.json()) as ChatResponse;
        } catch {
          data = null;
        }

        throw new Error(
          data?.error ?? "The assistant could not answer that just yet.",
        );
      }

      if (!response.ok) {
        throw new Error("The assistant could not answer that just yet.");
      }

      if (!response.body) {
        throw new Error(
          "I couldn't start the response stream. Please try again.",
        );
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamedAnswer = "";
      let streamFinished = false;

      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        while (true) {
          const boundary = buffer.indexOf("\n\n");

          if (boundary === -1) {
            break;
          }

          const rawEvent = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);

          const event = parseStreamEvent(rawEvent);

          if (!event) {
            continue;
          }

          if (event.type === "text") {
            streamedAnswer += event.data;
            setAnswer(streamedAnswer);
          }

          if (event.type === "error") {
            throw new Error(event.data || "The stream ended unexpectedly.");
          }

          if (event.type === "done") {
            streamFinished = true;
            break;
          }
        }

        if (streamFinished) {
          break;
        }
      }

      if (!streamedAnswer.trim()) {
        throw new Error("I got an empty answer back. Please try again.");
      }

      storeSearchHistory(message, streamedAnswer);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "I couldn't reach the assistant. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function askCachedQuestionAgain() {
    if (!cachedAnswerQuestion || isLoading) {
      return;
    }

    await submitMessage(cachedAnswerQuestion);
  }

  function goBackHome() {
    if (isLoading) {
      return;
    }

    setSubmittedPrompt("");
    setAnswer("");
    setError("");
    setCachedAnswerQuestion("");
    setSelectionAction(null);
    setSpeechError("");
    setSpeechStatus("idle");
    clearSpeechAudio();
  }

  async function askAboutSelection() {
    if (!selectionAction || isLoading) {
      return;
    }

    const selectedText = selectionAction.text;
    window.getSelection()?.removeAllRanges();
    setSelectionAction(null);
    await submitMessage(`Explain "${selectedText}"`);
  }

  async function playAnswerSpeech() {
    const speechText = answer.trim();

    if (!speechText || speechStatus === "loading") {
      return;
    }

    setSpeechError("");

    if (speechStatus === "playing") {
      audioRef.current?.pause();
      setSpeechStatus("idle");
      return;
    }

    if (audioRef.current && spokenAnswerRef.current === speechText) {
      try {
        setSpeechStatus("playing");
        await audioRef.current.play();
      } catch {
        clearSpeechAudio();
        setSpeechStatus("idle");
        setSpeechError("The audio could not be played in this browser.");
      }

      return;
    }

    clearSpeechAudio();

    const cachedAudio = speechCacheRef.current.get(speechText);

    if (cachedAudio) {
      const audio = new Audio(cachedAudio.url);

      audioRef.current = audio;
      audioUrlRef.current = cachedAudio.url;
      spokenAnswerRef.current = speechText;

      audio.onended = () => {
        clearSpeechAudio();
        setSpeechStatus("idle");
      };

      audio.onerror = () => {
        removeCachedSpeechAudio(speechText);
        clearSpeechAudio();
        setSpeechStatus("idle");
        setSpeechError("The cached audio could not be played.");
      };

      try {
        setSpeechStatus("playing");
        await audio.play();
      } catch {
        clearSpeechAudio();
        setSpeechStatus("idle");
        setSpeechError("The cached audio could not be played.");
      }

      return;
    }

    setSpeechStatus("loading");

    const persistedAudioBlob = await readPersistedSpeechAudio(speechText);

    if (persistedAudioBlob) {
      const audioUrl = URL.createObjectURL(persistedAudioBlob);
      const audio = new Audio(audioUrl);

      cacheSpeechAudio(speechText, audioUrl);
      audioRef.current = audio;
      audioUrlRef.current = audioUrl;
      spokenAnswerRef.current = speechText;

      audio.onended = () => {
        clearSpeechAudio();
        setSpeechStatus("idle");
      };

      audio.onerror = () => {
        removeCachedSpeechAudio(speechText);
        clearSpeechAudio();
        setSpeechStatus("idle");
        setSpeechError("The saved audio could not be played.");
      };

      try {
        setSpeechStatus("playing");
        await audio.play();
      } catch {
        clearSpeechAudio();
        setSpeechStatus("idle");
        setSpeechError("The saved audio could not be played.");
      }

      return;
    }

    try {
      const response = await fetch("/api/speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: speechText }),
      });

      if (!response.ok) {
        let data: SpeechErrorResponse | null = null;

        try {
          data = (await response.json()) as SpeechErrorResponse;
        } catch {
          data = null;
        }

        throw new Error(data?.error ?? "The answer could not be spoken yet.");
      }

      const pcmBuffer = await response.arrayBuffer();

      if (!pcmBuffer.byteLength) {
        throw new Error("I couldn't generate audio for that answer yet.");
      }

      const audioBlob = wrapPcmInWav(pcmBuffer);
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      cacheSpeechAudio(speechText, audioUrl);
      await writePersistedSpeechAudio(speechText, audioBlob);
      audioRef.current = audio;
      audioUrlRef.current = audioUrl;
      spokenAnswerRef.current = speechText;

      audio.onended = () => {
        clearSpeechAudio();
        setSpeechStatus("idle");
      };

      audio.onerror = () => {
        removeCachedSpeechAudio(speechText);
        clearSpeechAudio();
        setSpeechStatus("idle");
        setSpeechError("The generated audio could not be played.");
      };

      setSpeechStatus("playing");
      await audio.play();
    } catch (speechRequestError) {
      clearSpeechAudio();
      setSpeechStatus("idle");
      setSpeechError(
        speechRequestError instanceof Error
          ? speechRequestError.message
          : "I couldn't generate speech for that answer yet.",
      );
    }
  }

  function stopDictation() {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsDictating(false);
  }

  function startDictation() {
    if (isLoading) {
      return;
    }

    const Recognition = getSpeechRecognitionConstructor();

    if (!Recognition) {
      setDictationError(
        "Dictation is not supported in this browser. Try Chrome or Edge.",
      );
      return;
    }

    setDictationError("");
    setSelectionAction(null);
    dictationBasePromptRef.current = prompt.trim();
    finalTranscriptRef.current = "";

    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang =
      typeof navigator !== "undefined" && navigator.language
        ? navigator.language
        : "en-US";

    recognition.onstart = () => {
      setIsDictating(true);
    };

    recognition.onend = () => {
      setIsDictating(false);
      recognitionRef.current = null;
    };

    recognition.onerror = (event) => {
      setDictationError(getDictationErrorMessage(event.error));
      setIsDictating(false);
      recognitionRef.current = null;
    };

    recognition.onresult = (event) => {
      let finalTranscript = finalTranscriptRef.current;
      let interimTranscript = "";

      for (
        let index = event.resultIndex;
        index < event.results.length;
        index += 1
      ) {
        const result = event.results[index];
        const transcript = result?.[0]?.transcript ?? "";

        if (!transcript) {
          continue;
        }

        if (result?.isFinal) {
          finalTranscript = `${finalTranscript} ${transcript}`.trim();
        } else {
          interimTranscript = `${interimTranscript} ${transcript}`.trim();
        }
      }

      finalTranscriptRef.current = finalTranscript;

      const dictatedText = `${finalTranscript} ${interimTranscript}`
        .replace(/\s+/g, " ")
        .trim();
      const basePrompt = dictationBasePromptRef.current;
      const nextPrompt = [basePrompt, dictatedText].filter(Boolean).join(" ");

      setPrompt(nextPrompt.slice(0, MAX_CHAT_MESSAGE_LENGTH));
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch {
      setDictationError("Dictation could not start. Try the mic again.");
      setIsDictating(false);
    }
  }

  function toggleDictation() {
    if (isDictating) {
      stopDictation();
      return;
    }

    startDictation();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const message = prompt.trim();

    if (!message || isLoading) {
      return;
    }

    await submitMessage(message);
  }

  return (
    <div className="chat-shell relative flex min-h-screen flex-col overflow-hidden">
      <main className="relative flex flex-1 items-center justify-center px-6 pb-40 pt-28 sm:px-10">
        {showResult ? (
          <section className="w-full max-w-4xl">
            {!isLoading ? (
              <button
                type="button"
                onClick={goBackHome}
                className="ui-mono mb-6 rounded-full border border-white/14 bg-white/8 px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-white/70 transition duration-300 hover:-translate-y-px hover:border-white/25 hover:bg-white/14 hover:text-white active:translate-y-0 active:scale-[0.98]"
              >
                Back
              </button>
            ) : null}

            <p className="ui-mono mb-4 text-[0.72rem] uppercase tracking-[0.35em] text-white/55">
              YOU ASKED:
            </p>

            <h1 className="max-w-4xl text-4xl font-bold tracking-[-0.025em] text-white sm:text-5xl lg:text-[4.75rem]">
              {submittedPrompt}
            </h1>

            <div
              aria-live="polite"
              className="mt-8 rounded-[2rem] border border-white/12 bg-white/6 p-6 transition duration-300 hover:border-white/18 hover:bg-white/[0.08] sm:p-8"
            >
              {answer ? (
                <div
                  ref={answerRef}
                  className="max-w-3xl text-xl leading-9 text-white sm:text-[1.45rem] sm:leading-10"
                >
                  <FormattedAnswer content={answer} />
                </div>
              ) : null}

              {answer && !isLoading ? (
                <div className="mt-6 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={playAnswerSpeech}
                    disabled={speechStatus === "loading"}
                    aria-label={
                      speechStatus === "playing"
                        ? "Pause spoken answer"
                        : "Speak answer"
                    }
                    aria-busy={speechStatus === "loading"}
                    className={`rounded-full border p-3 transition duration-300 active:scale-[0.96] disabled:cursor-wait ${
                      speechStatus === "playing"
                        ? "border-white/30 bg-white text-black shadow-[0_0_24px_rgba(255,255,255,0.14)]"
                        : "border-white/12 bg-white/8 text-white/72 hover:-translate-y-px hover:border-white/22 hover:bg-white/12 hover:text-white"
                    }`}
                  >
                    {speechStatus === "loading" ? <LoadingIcon /> : null}
                    {speechStatus === "playing" ? <PauseIcon /> : null}
                    {speechStatus === "idle" ? <SpeakerIcon /> : null}
                  </button>

                  {cachedAnswerQuestion ? (
                    <button
                      type="button"
                      onClick={askCachedQuestionAgain}
                      className="ui-mono rounded-full border border-white/14 bg-white/8 px-4 py-3 text-xs font-medium uppercase tracking-[0.22em] text-white/78 transition duration-300 hover:-translate-y-px hover:border-white/25 hover:bg-white/14 hover:text-white active:translate-y-0 active:scale-[0.98]"
                    >
                      Ask Again
                    </button>
                  ) : null}

                  {speechError ? (
                    <p className="ui-mono text-xs uppercase tracking-[0.18em] text-rose-300/80">
                      {speechError}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {!answer && isLoading ? (
                <p className="ui-mono text-sm uppercase tracking-[0.28em] text-white/55">
                  Thinking...
                </p>
              ) : null}

              {error ? (
                <p
                  className={`text-lg leading-8 text-rose-300 ${
                    answer ? "mt-6 max-w-3xl" : "max-w-2xl"
                  }`}
                >
                  {error}
                </p>
              ) : null}

              {isLoading && answer ? (
                <p className="ui-mono mt-4 text-xs uppercase tracking-[0.28em] text-white/45">
                  Streaming...
                </p>
              ) : null}
            </div>
          </section>
        ) : (
          <section className="flex w-full max-w-4xl flex-col items-center">
            <div className="group relative flex items-center justify-center gap-4 sm:gap-5">
              <div
                aria-hidden="true"
                className="absolute left-7 h-16 w-16 rounded-full bg-white/0 blur-2xl transition duration-500 group-hover:bg-white/[0.08] sm:left-8 sm:h-18 sm:w-18 lg:left-10 lg:h-24 lg:w-24"
              />

              <Image
                src={GITHUB_AVATAR_URL}
                alt="Ömer Balkan GitHub profile picture"
                width={160}
                height={160}
                className="relative h-14 w-14 rounded-full object-cover ring-1 ring-white/15 transition duration-500 group-hover:scale-[1.06] group-hover:ring-white/28 group-hover:shadow-[0_0_28px_rgba(255,255,255,0.12)] sm:h-16 sm:w-16 lg:h-20 lg:w-20"
              />

              <h1 className="max-w-4xl text-left text-3xl font-bold tracking-[-0.015em] text-white transition duration-500 group-hover:translate-x-0.5 group-hover:text-white/92 sm:text-4xl lg:text-[4.25rem]">
                Ask anything about me
              </h1>
            </div>

            {showSearchHistory ? (
              <div className="mt-8 w-full max-w-3xl rounded-[1.75rem] border border-white/12 bg-white/[0.08] p-3 transition duration-300 hover:border-white/18 hover:bg-white/[0.10]">
                <p className="px-4 pb-3 pt-2 text-sm font-medium text-white/72">
                  Recent Searches
                </p>

                <div className="overflow-hidden rounded-[1.2rem] border border-white/8 bg-black/10">
                  {visibleSearchHistory.map((historyItem, index) => (
                    <div
                      key={historyItem.question}
                      className={`group flex items-center gap-2 px-3 py-2 transition duration-300 hover:bg-white/8 ${
                        index > 0 ? "border-t border-white/8" : ""
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => showSavedHistoryEntry(historyItem)}
                        disabled={isLoading}
                        className="flex min-w-0 flex-1 items-center gap-3 rounded-[1rem] px-1 py-1 text-left text-sm text-white/78 transition duration-300 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span className="text-white/45 transition duration-300 group-hover:translate-x-0.5 group-hover:scale-105 group-hover:text-white/72">
                          <SearchIcon />
                        </span>

                        <span className="truncate transition duration-300 group-hover:translate-x-0.5 group-hover:text-white">
                          {historyItem.question}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          removeSearchHistoryEntry(historyItem.question)
                        }
                        aria-label={`Remove recent search: ${historyItem.question}`}
                        className="pointer-events-none rounded-full p-2 text-white/42 opacity-0 transition duration-300 hover:bg-white/8 hover:text-white group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100"
                      >
                        <RemoveIcon />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        )}
      </main>

      {selectionAction && !isLoading ? (
        <button
          type="button"
          data-selection-action
          onMouseDown={(event) => event.preventDefault()}
          onClick={askAboutSelection}
          className="ui-mono fixed z-20 -translate-x-1/2 rounded-full border border-white/14 bg-white px-4 py-2 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-black shadow-[0_14px_40px_rgba(0,0,0,0.35)] transition duration-200 hover:-translate-x-1/2 hover:-translate-y-0.5 hover:bg-white/88 active:-translate-x-1/2 active:translate-y-0 active:scale-[0.98]"
          style={{
            left: selectionAction.x,
            top: selectionAction.y,
          }}
        >
          Ask about that
        </button>
      ) : null}

      <div className="ask-composer-dock pointer-events-none fixed inset-x-0 bottom-0 z-10 px-4 pb-4 sm:px-6 sm:pb-6">
        {dictationStatus ? (
          <p
            className={`ui-mono pointer-events-auto mx-auto mb-3 max-w-4xl px-4 text-xs uppercase tracking-[0.18em] ${
              dictationError ? "text-rose-300/80" : "text-white/50"
            }`}
          >
            {dictationStatus}
          </p>
        ) : null}

        <form
          onSubmit={handleSubmit}
          className="ask-composer pointer-events-auto mx-auto flex w-full max-w-4xl items-center gap-3 rounded-[2rem] border border-white/12 bg-white/8 p-3 backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-white/18 hover:bg-white/10 focus-within:-translate-y-0.5 focus-within:border-white/24 focus-within:bg-white/10 focus-within:shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
        >
          <label className="sr-only" htmlFor="prompt">
            Ask anything about BLCNYY
          </label>

          <input
            id="prompt"
            value={prompt}
            maxLength={MAX_CHAT_MESSAGE_LENGTH}
            onChange={(event) => setPrompt(event.target.value)}
            className="ask-composer-input ui-mono min-w-0 flex-1 bg-transparent px-3 py-3 text-base text-white outline-none placeholder:text-white/45 focus:placeholder:text-white/28 sm:text-lg"
            placeholder="Ask about work, projects, writing, or anything else..."
            autoComplete="off"
            spellCheck={false}
          />

          <button
            type="button"
            onClick={toggleDictation}
            disabled={isLoading}
            aria-label={isDictating ? "Stop dictation" : "Start dictation"}
            aria-pressed={isDictating}
            title={isDictating ? "Stop dictation" : "Dictate prompt"}
            className={`ask-composer-dictation rounded-[1.2rem] border px-4 py-3 text-sm transition duration-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 ${
              isDictating
                ? "border-white/35 bg-white text-black shadow-[0_0_24px_rgba(255,255,255,0.16)]"
                : "border-white/10 bg-white/8 text-white/72 hover:-translate-y-px hover:border-white/18 hover:bg-white/12 hover:text-white"
            }`}
          >
            <MicIcon isActive={isDictating} />
          </button>

          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="ask-composer-submit ui-mono rounded-[1.35rem] bg-white px-5 py-3 text-sm font-medium uppercase tracking-[0.2em] text-black transition duration-300 hover:-translate-y-px hover:bg-white/85 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-white/35"
          >
            {isLoading ? "..." : "Ask"}
          </button>
        </form>

      </div>
    </div>
  );
}
