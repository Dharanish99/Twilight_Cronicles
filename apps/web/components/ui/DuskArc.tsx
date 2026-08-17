"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/a11y/useReducedMotion";

interface DuskArcProps {
  /** Current question / round number (1-indexed) */
  round: number;
  /** Total rounds / questions in the session */
  totalRounds: number;
  /** Optional accessible label override */
  label?: string;
}

/**
 * A thin gradient progress bar with a glowing circular marker that slides
 * across as the session progresses. WCAG: uses role="progressbar" with
 * aria-valuenow/min/max. Respects prefers-reduced-motion.
 */
export function DuskArc({ round, totalRounds, label }: DuskArcProps) {
  const reduced = useReducedMotion();
  const markerRef = useRef<HTMLDivElement>(null);

  const progress = Math.min(Math.max((round - 1) / Math.max(totalRounds - 1, 1), 0), 1);
  const pct = `${(progress * 100).toFixed(1)}%`;

  // Update marker position via inline style for smooth CSS transition
  useEffect(() => {
    if (!markerRef.current) return;
    markerRef.current.style.left = pct;
  }, [pct]);

  return (
    <div
      className="w-full flex flex-col gap-1.5"
      role="progressbar"
      aria-valuenow={round}
      aria-valuemin={1}
      aria-valuemax={totalRounds}
      aria-label={label ?? `Question ${round} of ${totalRounds}`}
    >
      {/* Track */}
      <div className="relative h-[3px] w-full rounded-full bg-[var(--bg-elevated)] overflow-visible">
        {/* Filled portion */}
        <div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{
            width: pct,
            background: "linear-gradient(90deg, var(--accent-ember) 0%, var(--cat-deep) 100%)",
            transition: reduced ? "none" : "width 400ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />

        {/* Glowing marker dot */}
        <div
          ref={markerRef}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
          style={{
            left: pct,
            transition: reduced ? "none" : "left 400ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
          aria-hidden="true"
        >
          <div
            className="w-3 h-3 rounded-full border-2 border-[var(--bg-base)]"
            style={{
              background: "var(--accent-ember)",
              boxShadow: "0 0 6px 2px var(--accent-ember)",
            }}
          />
        </div>
      </div>

      {/* Label row */}
      <div className="flex justify-between items-center">
        <span className="text-[11px] text-[var(--ink-tertiary)]">Question {round}</span>
        <span className="text-[11px] text-[var(--ink-tertiary)] tabular-nums">
          {round} / {totalRounds}
        </span>
      </div>
    </div>
  );
}
