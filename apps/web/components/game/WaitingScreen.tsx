"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { CategoryId, TurnPhase } from "@twilight/shared-types";
import { getCategoryColor } from "@/lib/theme/categories";
import { useReducedMotion } from "@/lib/a11y/useReducedMotion";
import { lobbyPulse } from "@/lib/theme/motion";
import { getTimedCopy, pickCopy, CHOOSING_QUESTION_COPY } from "@/lib/copy/pools";
import { DoodleModal } from "./DoodleModal";

interface WaitingScreenProps {
  partnerName: string;
  phase: TurnPhase;
  chosenCategory?: CategoryId;
  round: number;
  totalRounds: number;
  customMessage?: string;
  /** Key that changes per question — resets the elapsed-time timer */
  questionKey?: string;
}

/** Static copy for phases other than "answering" */
function getStaticCopy(
  phase: TurnPhase,
  partnerName: string,
  loadingCopy: string,
  customMessage?: string
): string | null {
  if (customMessage) return customMessage;
  switch (phase) {
    case "choosing_category":
      return `${partnerName} is choosing a mood for you…`;
    case "question_loading":
      // Use the pre-picked weighted-random loading copy (stable per mount)
      return loadingCopy;
    case "locked":
      return `${partnerName} is locking in their answer…`;
    default:
      return null; // answering phase handled by tiered copy
  }
}

// ── Ember drift particle config ───────────────────────────────────────────────
const PARTICLE_COUNT = 5;
const PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  id: i,
  // Stagger: each particle has its own duration (6–9 s) and delay (0–5 s)
  duration: 6 + (i * 0.7) % 3,
  delay: (i * 1.3) % 5,
  left: `${15 + i * 16}%`,
  size: 4 + (i % 3),
}));

export function WaitingScreen({
  partnerName,
  phase,
  chosenCategory,
  round,
  totalRounds,
  customMessage,
  questionKey,
}: WaitingScreenProps) {
  const reduced = useReducedMotion();
  const pulseProps = lobbyPulse(reduced);
  const [doodleOpen, setDoodleOpen] = useState(false);

  // Doodle entry only visible during answering + locked phases
  const showDoodle = phase === "answering" || phase === "locked";

  // Pick loading copy once per question_loading mount — stable for the full beat
  const loadingCopyRef = useRef<string>(pickCopy(CHOOSING_QUESTION_COPY));
  useEffect(() => {
    if (phase === "question_loading") {
      loadingCopyRef.current = pickCopy(CHOOSING_QUESTION_COPY);
    }
  }, [phase, questionKey]);

  // ── Elapsed timer for time-tiered answering copy ──────────────────────────
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Reset timer whenever question or phase changes
    setElapsedSeconds(0);
    if (timerRef.current) clearInterval(timerRef.current);

    if (phase === "answering") {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, questionKey]);

  // ── Derive copy ───────────────────────────────────────────────────────────
  const staticCopy = getStaticCopy(phase, partnerName, loadingCopyRef.current, customMessage);
  const copy =
    phase === "answering"
      ? getTimedCopy(elapsedSeconds, partnerName)
      : staticCopy ?? `Waiting for ${partnerName}…`;

  // ── Particle / glow tint color ────────────────────────────────────────────
  const accentColor = chosenCategory
    ? getCategoryColor(chosenCategory)
    : "var(--accent-ember)";

  // Thread progress (merged with DuskArc concept — single element, no duplicate)
  const progressPct = `${Math.min(((round - 1) / Math.max(totalRounds - 1, 1)) * 100, 100).toFixed(1)}%`;

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[55vh] gap-6 text-center relative overflow-hidden"
      role="status"
      aria-live="polite"
      aria-label={copy}
    >
      {/* Category background wash — low-opacity tint when category is known */}
      {/* aria-hidden: decorative */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] transition-all duration-500"
        style={{
          background: chosenCategory
            ? `radial-gradient(ellipse at 50% 80%, ${accentColor}10 0%, transparent 70%)`
            : "transparent",
        }}
      />

      {/* Thread / progress bar — drawn at top, extends with round progress */}
      {/* This IS the DuskArc for the waiting screen — no duplicate indicator */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 w-full h-[2px] bg-[var(--bg-elevated)] overflow-hidden"
      >
        <motion.div
          className="h-full rounded-full origin-left"
          style={{ background: accentColor }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: parseFloat(progressPct) / 100 }}
          transition={reduced ? { duration: 0 } : { duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      {/* Ember drift particles — reduced: static soft gradient */}
      {!reduced ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          {PARTICLES.map((p) => (
            <motion.div
              key={p.id}
              className="absolute bottom-0 rounded-full opacity-0"
              style={{
                left: p.left,
                width: p.size,
                height: p.size,
                background: accentColor,
              }}
              animate={{
                y: [0, -280, -320],
                opacity: [0, 0.55, 0],
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          ))}
        </div>
      ) : (
        // Reduced-motion: static soft gradient instead of particles
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(to top, ${accentColor}08 0%, transparent 60%)`,
          }}
        />
      )}

      {/* Animated orb */}
      <motion.div
        {...pulseProps}
        className="w-16 h-16 rounded-full bg-surface-sunken border-2 border-theme-subtle shadow-md relative z-10"
        aria-hidden="true"
      />

      {/* Copy + round indicator */}
      <div className="flex flex-col gap-2 max-w-sm relative z-10">
        {/* Announce only on actual text change — aria-live="polite" on parent */}
        <p className="text-2xl text-ink-primary font-serif transition-all duration-500">
          {copy}
        </p>
        <p className="text-sm text-ink-tertiary tabular-nums">
          Question {round} of {totalRounds}
        </p>

        {/* Doodle entry — text-style, not a competing CTA */}
        {showDoodle && (
          <button
            onClick={() => setDoodleOpen(true)}
            className="mt-2 text-xs text-[var(--ink-tertiary)] hover:text-[var(--ink-secondary)] underline underline-offset-2 decoration-dotted transition-colors"
            aria-label="Open doodle canvas"
          >
            Doodle while you wait
          </button>
        )}
      </div>

      {/* Doodle modal — portaled, respects privacy model */}
      <DoodleModal
        isOpen={doodleOpen}
        onClose={() => setDoodleOpen(false)}
        partnerName={partnerName}
        currentRound={round}
      />
    </div>
  );
}
