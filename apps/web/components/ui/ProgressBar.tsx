"use client";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/lib/a11y/useReducedMotion";

interface ProgressBarProps {
  value: number; // 0–100
  max?: number;
  className?: string;
  "aria-label"?: string;
}

export function ProgressBar({ value, max = 100, className = "", "aria-label": ariaLabel }: ProgressBarProps) {
  const reduced = useReducedMotion();
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={ariaLabel ?? "Progress"}
      className={`h-0.5 bg-[var(--bg-sunken)] overflow-hidden ${className}`}
    >
      <motion.div
        className="h-full bg-[var(--accent-ember)] origin-left"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: pct / 100 }}
        transition={reduced ? { duration: 0 } : { duration: 0.4 }}
      />
    </div>
  );
}

// Timer — thin top progress line, near-end state at ≤15s
interface TimerProps {
  secondsRemaining: number;
  total: number;
}

export function Timer({ secondsRemaining, total }: TimerProps) {
  const reduced = useReducedMotion();
  const pct = Math.min(100, (secondsRemaining / total) * 100);
  const nearEnd = secondsRemaining <= 15;

  return (
    <div
      role="timer"
      aria-live="off"
      aria-label={`${secondsRemaining} seconds remaining`}
      className="fixed top-0 left-0 right-0 z-50 h-0.5"
    >
      <motion.div
        className={`h-full origin-left ${nearEnd ? "bg-[var(--danger)]" : "bg-[var(--accent-ember)]"}`}
        animate={{ scaleX: pct / 100 }}
        transition={reduced ? { duration: 0 } : { duration: 1, ease: "linear" }}
      />
    </div>
  );
}
