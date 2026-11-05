"use client";

import type { RefObject } from "react";

// What the site-wide particle backdrop should show. Pages write here and the
// backdrop reads it every frame, so updates never cause a React render.

export type BackdropFormation =
  | "halo"
  | "waves"
  | "spiral"
  | "orb"
  | "compass"
  | "cat"
  | "lattice"
  | "camera"
  | "starfield"
  | "warp"
  | "ask";

type ExploreStage = {
  formations: readonly BackdropFormation[];
  positionRef: RefObject<number>;
};

let exploreStage: ExploreStage | null = null;

// Explore registers its scene shapes and live scroll position while mounted.
export function setExploreStage(stage: ExploreStage | null) {
  exploreStage = stage;
}

export function getExploreStage() {
  return exploreStage;
}

type AskVoice = {
  // How loud the spoken answer is right now, from 0 to 1.
  level: () => number;
  playing: () => boolean;
};

// Ask's particle body follows what the conversation is doing.
export const askSignal: {
  thinking: boolean;
  answerShown: boolean;
  voice: AskVoice | null;
} = {
  thinking: false,
  answerShown: false,
  voice: null,
};