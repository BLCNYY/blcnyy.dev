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
import { type Dictionary, getDictionary } from "@/lib/dictionaries";
import type {
  ArticlePreview,
  ExploreProject,
} from "@/lib/explore-content";
import { localizePath, type Locale } from "@/lib/i18n";
import { instagram, socialLinks } from "@/lib/site";

type ExploreExperienceProps = {
  locale: Locale;
  articles: readonly ArticlePreview[];
  projects: readonly ExploreProject[];
  story: {
    heading: string;
    body: string;
  };
  tagline: string;
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

const GITHUB_AVATAR_URL = "https://github.com/BLCNYY.png?size=480";
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
  dictionary,
  displayPosition,
  index,
  number,
  project,
}: {
  activeIndex: number;
  dictionary: Dictionary;
  displayPosition: number;
  index: number;
  number: number;
  project: ExploreProject;
}) {
  const headingId = `project-${project.id}-title`;

  return (
    <Scene
      activeIndex={activeIndex}
      displayPosition={displayPosition}
      index={index}
      labelledBy={headingId}
    >
      <div className="scene-copy project-scene-copy">
        <p className="scene-kicker">
          {dictionary.explore.projectKicker(String(number).padStart(2, "0"))}
        </p>
        <h2 id={headingId} className="project-name">
          {project.name}
        </h2>
        <p className="project-statement">{project.statement}</p>
        <p className="scene-body project-summary">{project.summary}</p>
        {project.tags?.length ? (
          <ul className="project-tags">
            {project.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        ) : null}
        <div className="project-links">
          {project.links.map((link) => (
            <a
              key={link.url}
              className="scene-text-link"
              href={link.url}
              target="_blank"
              rel="noreferrer"
            >
              {link.label}
              <span aria-hidden="true"> ↗</span>
            </a>
          ))}
        </div>
      </div>
    </Scene>
  );
}

function InstagramScene({
  activeIndex,
  dictionary,
  displayPosition,
  index,
}: {
  activeIndex: number;
  dictionary: Dictionary;
  displayPosition: number;
  index: number;
}) {
  const copy = dictionary.explore.instagram;

  return (
    <Scene
      activeIndex={activeIndex}
      displayPosition={displayPosition}
      index={index}
      labelledBy="instagram-title"
      className="instagram-scene"
    >
      <div className="instagram-scene-copy">
        <div className="scene-copy">
          <p className="scene-kicker">{copy.kicker}</p>
          <h2 id="instagram-title" className="scene-title">
            {copy.title}
          </h2>
          <p className="scene-body">{copy.body}</p>
          <a
            className="scene-text-link"
            href={instagram.url}
            target="_blank"
            rel="noreferrer me"
          >
            {copy.cta}
            <span aria-hidden="true"> ↗</span>
          </a>
        </div>

        <a
          className="instagram-card"
          href={instagram.url}
          target="_blank"
          rel="noreferrer"
          tabIndex={-1}
          aria-hidden="true"
        >
          <span className="instagram-card-ring">
            <Image
              src={GITHUB_AVATAR_URL}
              alt=""
              width={480}
              height={480}
              className="instagram-card-avatar"
            />
          </span>
          <span className="instagram-card-handle">{instagram.handle}</span>
          <span className="instagram-card-platform">Instagram</span>
          <span className="instagram-card-tags">
            {copy.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </span>
          <span className="instagram-card-follow">{copy.follow}</span>
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
  dictionary,
  index,
  locale,
}: {
  article: ArticlePreview;
  dictionary: Dictionary;
  index: number;
  locale: Locale;
}) {
  const isLatest = index === 0;
  const date = formatIsoDate(article.date, locale);

  return (
    <Link
      href={localizePath(locale, `/blog/${article.slug}`)}
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
          <span>
            {isLatest
              ? [dictionary.explore.latest, date].filter(Boolean).join(" · ")
              : date}
          </span>
        </div>
        <h3 lang={article.language ?? undefined}>{article.title}</h3>
        {isLatest && article.summary ? (
          <p lang={article.language ?? undefined}>{article.summary}</p>
        ) : null}
        {isLatest && article.tags.length ? (
          <div
            className="article-preview-tags"
            aria-label={dictionary.explore.articleTopics}
          >
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
  locale,
  articles,
  projects,
  story,
  tagline,
}: ExploreExperienceProps) {
  const dictionary = getDictionary(locale);
  const sceneLabels = dictionary.explore.scenes;
  const firstProjectIndex = 3;
  const instagramIndex = firstProjectIndex + projects.length;
  const articlesIndex = instagramIndex + 1;
  const askIndex = articlesIndex + 1;
  const scenes = [
    { id: "identity", label: sceneLabels.identity },
    { id: "introduction", label: sceneLabels.introduction },
    { id: "story", label: sceneLabels.story },
    ...projects.map((project) => ({ id: project.id, label: project.name })),
    { id: "instagram", label: sceneLabels.instagram },
    { id: "articles", label: sceneLabels.articles },
    { id: "ask", label: sceneLabels.ask },
  ];
  const lastSceneIndex = scenes.length - 1;
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
      const nextPosition = clamp(requestedPosition, 0, lastSceneIndex);
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
    [lastSceneIndex, startPositionAnimation],
  );

  const goTo = useCallback((requestedIndex: number) => {
    const nextIndex = clamp(requestedIndex, 0, lastSceneIndex);

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
  }, [lastSceneIndex, setVirtualTarget]);

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
        lastSceneIndex,
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
  }, [lastSceneIndex, setVirtualTarget]);

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
        goTo(lastSceneIndex);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [goBy, goTo, lastSceneIndex]);

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

  const nextScene = scenes[activeIndex + 1];

  return (
    <main
      ref={containerRef}
      lang={locale}
      className={`explore-experience ${isReady ? "is-ready" : ""}`}
      onTouchCancel={finishTouchGesture}
      onTouchMove={handleTouchMove}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <p className="sr-only" aria-live="polite">
        {dictionary.explore.sectionStatus(
          activeIndex + 1,
          scenes.length,
          scenes[activeIndex].label,
        )}
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
            <ul className="identity-links" aria-label={dictionary.explore.elsewhere}>
              {socialLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.url} target="_blank" rel="noreferrer me">
                    {link.label}
                    <span aria-hidden="true"> ↗</span>
                  </a>
                </li>
              ))}
            </ul>
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
            {tagline}
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
          <p className="scene-kicker">{dictionary.explore.storyKicker}</p>
          <h2 id="story-title" className="scene-title">
            {story.heading}
          </h2>
          <p className="scene-body">{story.body}</p>
        </div>
      </Scene>

      {projects.map((project, projectIndex) => (
        <ProjectScene
          key={project.id}
          activeIndex={activeIndex}
          dictionary={dictionary}
          displayPosition={displayPosition}
          index={firstProjectIndex + projectIndex}
          number={projectIndex + 1}
          project={project}
        />
      ))}

      <InstagramScene
        activeIndex={activeIndex}
        dictionary={dictionary}
        displayPosition={displayPosition}
        index={instagramIndex}
      />

      <Scene
        activeIndex={activeIndex}
        displayPosition={displayPosition}
        index={articlesIndex}
        labelledBy="articles-title"
        className="articles-scene"
      >
        <div className="articles-scene-copy">
          <div className="articles-heading-row">
            <div>
              <p className="scene-kicker">{dictionary.explore.writingKicker}</p>
              <h2 id="articles-title" className="articles-title">
                {dictionary.explore.latestArticles}
              </h2>
            </div>
            <Link
              href={localizePath(locale, "/blog")}
              className="scene-text-link articles-all-link"
            >
              {dictionary.explore.allArticles} <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className="articles-grid">
            {articles.map((article, index) => (
              <ArticleCard
                key={article.id}
                article={article}
                dictionary={dictionary}
                index={index}
                locale={locale}
              />
            ))}
          </div>
        </div>
      </Scene>

      <Scene
        activeIndex={activeIndex}
        displayPosition={displayPosition}
        index={askIndex}
        labelledBy="ask-invitation-title"
        className="ask-invitation-scene"
      >
        <div className="scene-copy ask-invitation-copy">
          <h2 id="ask-invitation-title" className="ask-invitation-title">
            {dictionary.explore.askTitle}
          </h2>
          <Link
            href={localizePath(locale, "/ask")}
            className="ask-depth-button"
          >
            <span>{dictionary.explore.askCta}</span>
          </Link>
        </div>
      </Scene>

      <nav className="scene-progress" aria-label={dictionary.explore.sectionsLabel}>
        {scenes.map((scene, index) => (
          <button
            key={scene.id}
            type="button"
            className={index === activeIndex ? "is-active" : ""}
            aria-label={dictionary.explore.goTo(scene.label)}
            aria-current={index === activeIndex ? "step" : undefined}
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
          aria-label={dictionary.explore.continueTo(nextScene.label)}
        >
          {activeIndex > 0 ? (
            <span className="scene-advance-label">
              {dictionary.explore.continue}
            </span>
          ) : null}
          <span className="scene-advance-arrow" aria-hidden="true">
            ↓
          </span>
        </button>
      ) : null}
    </main>
  );
}
