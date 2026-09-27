"use client";

import Image from "next/image";
import Link from "next/link";
import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type TouchEvent as ReactTouchEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { formatIsoDate } from "@/lib/date";
import type {
  ArticlePreview,
  ExploreProject,
} from "@/lib/explore-content";

type ExploreExperienceProps = {
  articles: readonly ArticlePreview[];
  projects: readonly ExploreProject[];
  story: {
    heading: string;
    body: string;
  };
};

type SceneProps = {
  activeIndex: number;
  children: ReactNode;
  className?: string;
  displayPosition: number;
  index: number;
  labelledBy: string;
};

type SceneStyle = CSSProperties & {
  "--scene-blur": string;
  "--scene-offset": string;
  "--scene-opacity": number;
  "--scene-scale": number;
};

const scenes = [
  { id: "identity", label: "Identity" },
  { id: "introduction", label: "Introduction" },
  { id: "story", label: "Story" },
  { id: "salah-now", label: "Salah Now" },
  { id: "articles", label: "Articles" },
  { id: "ask", label: "Ask" },
] as const;

const GITHUB_AVATAR_URL = "https://github.com/BLCNYY.png?size=480";
const LAST_SCENE_INDEX = scenes.length - 1;
const POSITION_EPSILON = 0.001;
const WHEEL_GESTURE_SETTLE_MS = 115;
const WHEEL_TRAVEL_PER_SCENE = 90;
const WHEEL_COMMIT_DISTANCE = 36;
const TOUCH_TRAVEL_PER_SCENE = 145;
const TOUCH_COMMIT_DISTANCE = 42;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function isInteractiveTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    Boolean(target.closest("a, button, input, textarea, select, [contenteditable]"))
  );
}

function Scene({
  activeIndex,
  children,
  className = "",
  displayPosition,
  index,
  labelledBy,
}: SceneProps) {
  const state =
    index === activeIndex ? "active" : index < activeIndex ? "before" : "after";
  const isActive = state === "active";
  const distance = index - displayPosition;
  const visualDistance = clamp(distance, -1, 1);
  const proximity = Math.min(Math.abs(distance), 1);
  const style: SceneStyle = {
    "--scene-blur": `${proximity * 14}px`,
    "--scene-offset": `${visualDistance * 7}vh`,
    "--scene-opacity": Math.max(0, 1 - Math.abs(distance)),
    "--scene-scale": 1 - proximity * 0.018,
  };

  return (
    <section
      className={`explore-scene is-${state} ${className}`}
      data-active={isActive ? "true" : "false"}
      aria-hidden={!isActive}
      aria-labelledby={labelledBy}
      inert={isActive ? undefined : true}
      style={style}
    >
      {children}
    </section>
  );
}

function ProjectScene({
  activeIndex,
  displayPosition,
  index,
  project,
}: {
  activeIndex: number;
  displayPosition: number;
  index: number;
  project: ExploreProject;
}) {
  const headingId = `project-${index}-title`;

  return (
    <Scene
      activeIndex={activeIndex}
      displayPosition={displayPosition}
      index={index}
      labelledBy={headingId}
    >
      <div className="scene-copy project-scene-copy">
        <p className="scene-kicker">
          Project {String(index - 2).padStart(2, "0")}
        </p>
        <h2 id={headingId} className="project-name">
          {project.name}
        </h2>
        <p className="project-statement">{project.statement}</p>
        <p className="scene-body project-summary">{project.summary}</p>
        <a
          className="scene-text-link"
          href={project.url}
          target="_blank"
          rel="noreferrer"
        >
          {project.domain}
          <span aria-hidden="true"> ↗</span>
        </a>
      </div>
    </Scene>
  );
}

function updateArticlePointer(event: ReactPointerEvent<HTMLAnchorElement>) {
  if (event.pointerType === "touch") {
    return;
  }

  const card = event.currentTarget;
  const bounds = card.getBoundingClientRect();
  const x = clamp((event.clientX - bounds.left) / bounds.width, 0, 1);
  const y = clamp((event.clientY - bounds.top) / bounds.height, 0, 1);

  card.style.setProperty("--pointer-x", `${x * 100}%`);
  card.style.setProperty("--pointer-y", `${y * 100}%`);
  card.style.setProperty("--card-rotate-x", `${(0.5 - y) * 20}deg`);
  card.style.setProperty("--card-rotate-y", `${(x - 0.5) * 20}deg`);
  card.style.setProperty("--card-shadow-x", `${(0.5 - x) * 36}px`);
  card.style.setProperty("--card-shadow-y", `${18 + (0.5 - y) * 24}px`);
}

function resetArticleTilt(card: HTMLAnchorElement) {
  card.style.removeProperty("--card-rotate-x");
  card.style.removeProperty("--card-rotate-y");
}

function prepareArticleFocus(card: HTMLAnchorElement) {
  resetArticleTilt(card);

  if (!card.matches(":hover")) {
    card.style.removeProperty("--pointer-x");
    card.style.removeProperty("--pointer-y");
    card.style.removeProperty("--card-shadow-x");
    card.style.removeProperty("--card-shadow-y");
  }
}

function ArticleCard({
  article,
  index,
}: {
  article: ArticlePreview;
  index: number;
}) {
  const isLatest = index === 0;

  return (
    <Link
      href={`/blog/${article.slug}`}
      className={`article-preview-card ${isLatest ? "is-latest" : ""}`}
      onBlur={(event) => resetArticleTilt(event.currentTarget)}
      onFocus={(event) => prepareArticleFocus(event.currentTarget)}
      onPointerEnter={updateArticlePointer}
      onPointerLeave={(event) => resetArticleTilt(event.currentTarget)}
      onPointerMove={updateArticlePointer}
    >
      <div className="article-preview-card-surface">
        {isLatest ? (
          <span className="article-latest-hover-fill" aria-hidden="true" />
        ) : null}
        <span className="article-pointer-stroke" aria-hidden="true" />
        <div className="article-preview-meta">
          <span>{isLatest ? "Latest" : formatIsoDate(article.date)}</span>
        </div>
        <h3>{article.title}</h3>
        {isLatest && article.summary ? <p>{article.summary}</p> : null}
        {isLatest && article.tags.length ? (
          <div className="article-preview-tags" aria-label="Article topics">
            {article.tags.slice(0, 2).map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

export function ExploreExperience({
  articles,
  projects,
  story,
}: ExploreExperienceProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [displayPosition, setDisplayPosition] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const containerRef = useRef<HTMLElement>(null);
  const activeIndexRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const animationTimeRef = useRef<number | null>(null);
  const displayPositionRef = useRef(0);
  const targetPositionRef = useRef(0);
  const wheelAccumulatorRef = useRef(0);
  const wheelGestureActiveRef = useRef(false);
  const wheelGestureOriginRef = useRef(0);
  const wheelResetTimerRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchDistanceRef = useRef(0);
  const touchOriginRef = useRef(0);

  const startPositionAnimation = useCallback(() => {
    if (animationFrameRef.current !== null) {
      return;
    }

    animationTimeRef.current = null;

    const animate = (time: number) => {
      const currentPosition = displayPositionRef.current;
      const difference = targetPositionRef.current - currentPosition;

      if (Math.abs(difference) <= POSITION_EPSILON) {
        const settledPosition = targetPositionRef.current;
        displayPositionRef.current = settledPosition;
        setDisplayPosition(settledPosition);
        animationFrameRef.current = null;
        animationTimeRef.current = null;
        return;
      }

      const elapsed = animationTimeRef.current === null
        ? 16.7
        : Math.min(time - animationTimeRef.current, 34);
      const blend = 1 - Math.exp(-elapsed / 105);
      const nextPosition = currentPosition + difference * blend;

      animationTimeRef.current = time;
      displayPositionRef.current = nextPosition;
      setDisplayPosition(nextPosition);
      animationFrameRef.current = window.requestAnimationFrame(animate);
    };

    animationFrameRef.current = window.requestAnimationFrame(animate);
  }, []);

  const setVirtualTarget = useCallback(
    (requestedPosition: number) => {
      const nextPosition = clamp(requestedPosition, 0, LAST_SCENE_INDEX);
      targetPositionRef.current = nextPosition;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        if (animationFrameRef.current !== null) {
          window.cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }

        animationTimeRef.current = null;
        displayPositionRef.current = nextPosition;
        setDisplayPosition(nextPosition);
        return;
      }

      startPositionAnimation();
    },
    [startPositionAnimation],
  );

  const goTo = useCallback((requestedIndex: number) => {
    const nextIndex = clamp(requestedIndex, 0, LAST_SCENE_INDEX);

    if (wheelResetTimerRef.current !== null) {
      window.clearTimeout(wheelResetTimerRef.current);
      wheelResetTimerRef.current = null;
    }

    wheelAccumulatorRef.current = 0;
    wheelGestureActiveRef.current = false;
    touchStartYRef.current = null;
    touchDistanceRef.current = 0;
    activeIndexRef.current = nextIndex;
    setActiveIndex(nextIndex);
    setVirtualTarget(nextIndex);
  }, [setVirtualTarget]);

  const goBy = useCallback(
    (amount: number) => {
      goTo(activeIndexRef.current + amount);
    },
    [goTo],
  );

  useEffect(() => {
    document.documentElement.classList.add("explore-locked");
    const readyFrame = window.requestAnimationFrame(() => setIsReady(true));

    return () => {
      document.documentElement.classList.remove("explore-locked");
      window.cancelAnimationFrame(readyFrame);

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }

      if (wheelResetTimerRef.current !== null) {
        window.clearTimeout(wheelResetTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const finishWheelGesture = () => {
      const origin = wheelGestureOriginRef.current;
      const accumulatedDistance = wheelAccumulatorRef.current;
      const direction = accumulatedDistance > 0 ? 1 : -1;
      const shouldAdvance =
        Math.abs(accumulatedDistance) >= WHEEL_COMMIT_DISTANCE;
      const nextIndex = clamp(
        shouldAdvance ? origin + direction : origin,
        0,
        LAST_SCENE_INDEX,
      );

      wheelAccumulatorRef.current = 0;
      wheelGestureActiveRef.current = false;
      wheelResetTimerRef.current = null;
      activeIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);
      setVirtualTarget(nextIndex);
    };

    const handleWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
        return;
      }

      event.preventDefault();

      if (!wheelGestureActiveRef.current) {
        wheelGestureActiveRef.current = true;
        wheelGestureOriginRef.current = activeIndexRef.current;
        wheelAccumulatorRef.current = 0;
      }

      if (wheelResetTimerRef.current !== null) {
        window.clearTimeout(wheelResetTimerRef.current);
      }

      wheelResetTimerRef.current = window.setTimeout(
        finishWheelGesture,
        WHEEL_GESTURE_SETTLE_MS,
      );

      const multiplier =
        event.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? 16
          : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? window.innerHeight
            : 1;

      wheelAccumulatorRef.current = clamp(
        wheelAccumulatorRef.current + event.deltaY * multiplier,
        -WHEEL_TRAVEL_PER_SCENE,
        WHEEL_TRAVEL_PER_SCENE,
      );

      const progress = wheelAccumulatorRef.current / WHEEL_TRAVEL_PER_SCENE;
      setVirtualTarget(wheelGestureOriginRef.current + progress);
    };

    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);

      if (wheelResetTimerRef.current !== null) {
        window.clearTimeout(wheelResetTimerRef.current);
        wheelResetTimerRef.current = null;
      }
    };
  }, [setVirtualTarget]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.isComposing ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        isInteractiveTarget(event.target)
      ) {
        return;
      }

      if (
        event.key === "ArrowDown" ||
        event.key === "ArrowRight" ||
        event.key === "PageDown" ||
        (event.key === " " && !event.shiftKey)
      ) {
        event.preventDefault();
        goBy(1);
        return;
      }

      if (
        event.key === "ArrowUp" ||
        event.key === "ArrowLeft" ||
        event.key === "PageUp" ||
        (event.key === " " && event.shiftKey)
      ) {
        event.preventDefault();
        goBy(-1);
        return;
      }

      if (event.key === "Home") {
        event.preventDefault();
        goTo(0);
      }

      if (event.key === "End") {
        event.preventDefault();
        goTo(scenes.length - 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [goBy, goTo]);

  const handleTouchStart = (event: ReactTouchEvent<HTMLElement>) => {
    if (event.touches.length !== 1) {
      return;
    }

    touchStartYRef.current = event.changedTouches[0]?.clientY ?? null;
    touchDistanceRef.current = 0;
    touchOriginRef.current = activeIndexRef.current;
  };

  const handleTouchMove = (event: ReactTouchEvent<HTMLElement>) => {
    const startY = touchStartYRef.current;
    const currentY = event.touches[0]?.clientY;

    if (startY === null || currentY === undefined || event.touches.length !== 1) {
      return;
    }

    const distance = clamp(
      startY - currentY,
      -TOUCH_TRAVEL_PER_SCENE,
      TOUCH_TRAVEL_PER_SCENE,
    );
    touchDistanceRef.current = distance;
    setVirtualTarget(touchOriginRef.current + distance / TOUCH_TRAVEL_PER_SCENE);
  };

  const finishTouchGesture = () => {
    const distance = touchDistanceRef.current;
    const origin = touchOriginRef.current;
    const nextIndex = Math.abs(distance) >= TOUCH_COMMIT_DISTANCE
      ? origin + (distance > 0 ? 1 : -1)
      : origin;

    touchStartYRef.current = null;
    touchDistanceRef.current = 0;
    goTo(nextIndex);
  };

  const handleTouchEnd = (event: ReactTouchEvent<HTMLElement>) => {
    if (event.touches.length === 0) {
      finishTouchGesture();
    }
  };

  const firstProject = projects[0];
  const nextScene = scenes[activeIndex + 1];

  return (
    <main
      ref={containerRef}
      className={`explore-experience ${isReady ? "is-ready" : ""}`}
      onTouchCancel={finishTouchGesture}
      onTouchMove={handleTouchMove}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <p className="sr-only" aria-live="polite">
        Section {activeIndex + 1} of {scenes.length}: {scenes[activeIndex].label}
      </p>

      <Scene
        activeIndex={activeIndex}
        displayPosition={displayPosition}
        index={0}
        labelledBy="identity-title"
      >
        <div className="identity-scene-copy">
          <div className="identity-avatar-wrap">
            <Image
              src={GITHUB_AVATAR_URL}
              alt=""
              width={480}
              height={480}
              preload
              className="identity-avatar"
            />
          </div>
          <div>
            <h1 id="identity-title" className="identity-name">
              BLCNYY
            </h1>
            <p className="identity-real-name">Ömer Balkan</p>
          </div>
        </div>
      </Scene>

      <Scene
        activeIndex={activeIndex}
        displayPosition={displayPosition}
        index={1}
        labelledBy="introduction-title"
      >
        <div className="scene-copy tagline-scene-copy">
          <h2 id="introduction-title" className="tagline-title">
            Vibe-coder and tech enthusiast from day one
          </h2>
        </div>
      </Scene>

      <Scene
        activeIndex={activeIndex}
        displayPosition={displayPosition}
        index={2}
        labelledBy="story-title"
      >
        <div className="scene-copy story-scene-copy">
          <p className="scene-kicker">My story</p>
          <h2 id="story-title" className="scene-title">
            {story.heading}
          </h2>
          <p className="scene-body">{story.body}</p>
        </div>
      </Scene>

      {firstProject ? (
        <ProjectScene
          activeIndex={activeIndex}
          displayPosition={displayPosition}
          index={3}
          project={firstProject}
        />
      ) : null}

      <Scene
        activeIndex={activeIndex}
        displayPosition={displayPosition}
        index={4}
        labelledBy="articles-title"
        className="articles-scene"
      >
        <div className="articles-scene-copy">
          <div className="articles-heading-row">
            <div>
              <p className="scene-kicker">Writing</p>
              <h2 id="articles-title" className="articles-title">
                Latest articles
              </h2>
            </div>
            <Link href="/blog" className="scene-text-link articles-all-link">
              All articles <span aria-hidden="true">↗</span>
            </Link>
          </div>

          <div className="articles-grid">
            {articles.map((article, index) => (
              <ArticleCard key={article.id} article={article} index={index} />
            ))}
          </div>
        </div>
      </Scene>

      <Scene
        activeIndex={activeIndex}
        displayPosition={displayPosition}
        index={5}
        labelledBy="ask-invitation-title"
        className="ask-invitation-scene"
      >
        <div className="scene-copy ask-invitation-copy">
          <h2 id="ask-invitation-title" className="ask-invitation-title">
            Want to go deeper?
          </h2>
          <Link
            href="/ask"
            className="ask-depth-button"
          >
            <span>Just Ask!</span>
          </Link>
        </div>
      </Scene>

      <nav className="scene-progress" aria-label="Explore sections">
        {scenes.map((scene, index) => (
          <button
            key={scene.id}
            type="button"
            className={index === activeIndex ? "is-active" : ""}
            aria-label={`Go to ${scene.label}`}
            aria-pressed={index === activeIndex}
            onClick={() => goTo(index)}
          >
            <span />
          </button>
        ))}
      </nav>

      {nextScene ? (
        <button
          type="button"
          className="scene-advance"
          onClick={() => goBy(1)}
          aria-label={`Continue to ${nextScene.label}`}
        >
          {activeIndex > 0 ? (
            <span className="scene-advance-label">Continue</span>
          ) : null}
          <span className="scene-advance-arrow" aria-hidden="true">
            ↓
          </span>
        </button>
      ) : null}
    </main>
  );
}
