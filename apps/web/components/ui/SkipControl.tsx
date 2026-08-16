"use client";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/lib/a11y/useReducedMotion";

interface SkipControlProps {
  onSkip: () => void;
  disabled?: boolean;
}

export function SkipControl({ onSkip, disabled = false }: SkipControlProps) {
  const reduced = useReducedMotion();

  return (
    <motion.button
      onClick={onSkip}
      disabled={disabled}
      whileTap={reduced ? {} : { scale: 0.97 }}
      className="text-sm text-[var(--ink-tertiary)] hover:text-[var(--ink-secondary)] underline underline-offset-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      aria-label="Skip this question"
    >
      Not this one
    </motion.button>
  );
}
