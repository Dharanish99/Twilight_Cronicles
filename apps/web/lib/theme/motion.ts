"use client";

/**
 * § 7 — Framer Motion Variant Library
 * All named animation variants used across Twilight Chronicles.
 * Each variant includes a prefersReducedMotion branch.
 * Import from this file everywhere — never inline transitions for these moments.
 */

export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;

/** lobbyPulse — breathing opacity on empty invite slot */
export function lobbyPulse(reduced: boolean) {
  if (reduced) return {};
  return {
    animate: { opacity: [0.5, 1, 0.5] },
    transition: { duration: 3.5, repeat: Infinity, ease: "easeInOut" as const },
  };
}

/** categoryGridEnter — staggered fade + rise per card */
export const categoryGridContainer = (reduced: boolean) => ({
  hidden: {},
  visible: {
    transition: reduced
      ? {}
      : { staggerChildren: 0.04, delayChildren: 0 },
  },
});

export const categoryCardItem = (reduced: boolean) => ({
  hidden: reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: reduced
      ? { duration: 0 }
      : { duration: 0.3, ease: EASE_OUT },
  },
});

/** categoryCardPress — scale on pointer down */
export const categoryCardPress = (reduced: boolean) => ({
  whileTap: reduced ? {} : { scale: 0.98 },
  transition: { duration: 0.1, ease: EASE_OUT },
});

/** questionReveal — fade + rise when question state mounts */
export const questionReveal = (reduced: boolean) => ({
  initial: reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: reduced
    ? { duration: 0 }
    : { duration: 0.25, ease: EASE_OUT },
});

/** answerLockSettle — background/border transition on lock */
export const answerLockSettle = (reduced: boolean) => ({
  transition: reduced
    ? { duration: 0 }
    : { duration: 0.15, ease: EASE_IN_OUT },
});

/** revealAnswerAppear — reveal answer after question */
export const revealAnswerAppear = (reduced: boolean) => ({
  initial: reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: reduced
    ? { duration: 0 }
    : { duration: 0.3, delay: 0.15, ease: EASE_OUT },
});

/** turnTransitionCrossfade — between turn-done states */
export const turnTransitionCrossfade = (reduced: boolean) => ({
  initial: reduced ? { opacity: 1 } : { opacity: 0 },
  animate: { opacity: 1 },
  exit: reduced ? { opacity: 1 } : { opacity: 0 },
  transition: reduced
    ? { duration: 0 }
    : { duration: 0.4, ease: EASE_IN_OUT },
});

/** bottomSheetEnter — sheet slides up from bottom */
export const bottomSheetEnter = (reduced: boolean) => ({
  initial: reduced ? { opacity: 0 } : { opacity: 0, y: "100%" },
  animate: reduced ? { opacity: 1 } : { opacity: 1, y: 0 },
  exit: reduced ? { opacity: 0 } : { opacity: 0, y: "100%" },
  transition: reduced
    ? { duration: 0.2 }
    : { duration: 0.25, ease: EASE_OUT },
});

export const backdropEnter = (reduced: boolean) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: reduced ? 0.1 : 0.25, ease: EASE_OUT },
});

/** toastEnter — toast notification slides/fades in */
export const toastEnter = (reduced: boolean) => ({
  initial: reduced ? { opacity: 0 } : { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: reduced ? { opacity: 0 } : { opacity: 0, y: 8 },
  transition: reduced
    ? { duration: 0.1 }
    : { duration: 0.2, ease: EASE_OUT },
});

/** completionGlow — soft bloom on game complete */
export const completionGlow = (reduced: boolean) => ({
  initial: { opacity: 0, scale: reduced ? 1 : 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: reduced
    ? { duration: 0 }
    : { duration: 0.6, ease: EASE_OUT },
});

// ─── NEW TOKENS (design/motion pass) ─────────────────────────────────────────

/**
 * inkSettle — text mounts with a blur-dissolve combined with questionReveal.
 * Run concurrently with questionReveal, not after. Purely visual; text is in the
 * DOM immediately for the a11y tree.
 * Reduced: instant render, no blur.
 */
export const inkSettle = (reduced: boolean) => ({
  initial: reduced ? { filter: "blur(0px)", opacity: 1 } : { filter: "blur(6px)", opacity: 0 },
  animate: { filter: "blur(0px)", opacity: 1 },
  transition: reduced
    ? { duration: 0 }
    : { duration: 0.35, ease: EASE_OUT },
});

/**
 * lockSeal — "Lock it in" tapped. Scale settle + brief inset-shadow.
 * The navigator.vibrate(12) call must be performed at the call-site,
 * not inside this token — motion tokens are pure data.
 * Reduced: instant style swap, no scale.
 */
export const lockSeal = (reduced: boolean) => ({
  animate: reduced
    ? {}
    : {
        scale: [1, 0.98, 1],
        boxShadow: [
          "inset 0 0 0 0px var(--accent-ember)",
          "inset 0 0 0 2px var(--accent-ember)",
          "inset 0 0 0 0px var(--accent-ember)",
        ],
      },
  transition: reduced
    ? { duration: 0 }
    : { duration: 0.22, ease: EASE_IN_OUT },
});

/**
 * shareDrift — locked card exits by translating toward the trailing screen edge.
 * Apply as `exit` on the locked card AnimatePresence wrapper.
 * Reduced: instant fade only, no translate.
 */
export const shareDrift = (reduced: boolean) => ({
  initial: { opacity: 1, x: 0 },
  exit: reduced
    ? { opacity: 0 }
    : { opacity: 0, x: 32 },
  transition: reduced
    ? { duration: 0.15 }
    : { duration: 0.3, ease: EASE_IN_OUT },
});

/**
 * skipDrift — dismissed question drifts down, replacement fades in from below.
 * Use `exit` on the dismissed card and `initial` on the entering card.
 * Reduced: instant crossfade.
 */
export const skipDriftExit = (reduced: boolean) => ({
  exit: reduced ? { opacity: 0 } : { opacity: 0, y: 12 },
  transition: reduced ? { duration: 0.1 } : { duration: 0.2, ease: EASE_OUT },
});

export const skipDriftEnter = (reduced: boolean) => ({
  initial: reduced ? { opacity: 0 } : { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: reduced ? { duration: 0.1 } : { duration: 0.2, ease: EASE_OUT },
});

/**
 * threadExtend — a line draws between two points.
 * Implemented via SVG `pathLength` or scaleX on a div.
 * Reduced: instant full-length line, no draw-on animation.
 */
export const threadExtend = (reduced: boolean) => ({
  initial: { scaleX: 0, originX: 0 },
  animate: { scaleX: 1 },
  transition: reduced
    ? { duration: 0 }
    : { duration: 0.6, ease: EASE_OUT },
});

/**
 * afterglowDevelop — card starts desaturated+blurred, resolves like a photograph developing.
 * Reduced: instant full-clarity render.
 */
export const afterglowDevelop = (reduced: boolean) => ({
  initial: reduced
    ? { filter: "saturate(1) blur(0px)", opacity: 1 }
    : { filter: "saturate(0.1) blur(4px)", opacity: 0.6 },
  animate: { filter: "saturate(1) blur(0px)", opacity: 1 },
  transition: reduced
    ? { duration: 0 }
    : { duration: 0.7, ease: EASE_OUT },
});

/**
 * reactionBloom — brief soft bloom behind the answer area when a reaction is tapped.
 * Shorter than afterglowDevelop, ~300ms, purely visual flourish.
 * Reduced: instant show, no scale.
 */
export const reactionBloom = (reduced: boolean) => ({
  initial: { opacity: 0, scale: reduced ? 1 : 0.85 },
  animate: { opacity: [0, 0.35, 0], scale: reduced ? 1 : [0.85, 1.15, 1] },
  transition: reduced
    ? { duration: 0 }
    : { duration: 0.3, ease: EASE_IN_OUT },
});
