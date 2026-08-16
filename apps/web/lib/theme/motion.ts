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
