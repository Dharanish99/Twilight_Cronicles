"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "@/lib/a11y/useReducedMotion";
import { turnTransitionCrossfade } from "@/lib/theme/motion";

interface TurnTransitionProps {
  nextPlayerName: string;
  isNowYourTurn: boolean;
}

export function TurnTransition({ nextPlayerName, isNowYourTurn }: TurnTransitionProps) {
  const reduced = useReducedMotion();
  const anim = turnTransitionCrossfade(reduced);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={isNowYourTurn ? "your-turn" : "their-turn"}
        {...anim}
        className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center"
        aria-live="polite"
        role="status"
      >
        <p className="text-[var(--ink-secondary)] text-lg">Your turn is done.</p>
        <p className="text-2xl font-semibold text-[var(--ink-primary)]">
          {isNowYourTurn ? "Now it’s your turn." : `Now it’s ${nextPlayerName}’s turn.`}
        </p>
      </motion.div>
    </AnimatePresence>
  );
}
