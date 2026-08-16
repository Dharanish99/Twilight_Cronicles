"use client";
import { motion } from "framer-motion";
import type { CategoryId, TurnPhase } from "@twilight/shared-types";
import { CATEGORIES } from "@/lib/theme/categories";
import { useReducedMotion } from "@/lib/a11y/useReducedMotion";
import { lobbyPulse } from "@/lib/theme/motion";

interface WaitingScreenProps {
  partnerName: string;
  phase: TurnPhase;
  chosenCategory?: CategoryId;
  round: number;
  totalRounds: number;
  customMessage?: string;
}

function getWaitingCopy(
  phase: TurnPhase,
  partnerName: string,
  chosenCategory?: CategoryId,
  customMessage?: string
): string {
  if (customMessage) return customMessage;
  switch (phase) {
    case "choosing_category":
      return `${partnerName} is choosing a mood for you…`;
    case "question_loading":
      return chosenCategory
        ? `Preparing a question in ${CATEGORIES[chosenCategory]?.label ?? chosenCategory} for you…`
        : "Preparing the question…";
    case "answering":
      return `${partnerName} is privately answering your question…`;
    case "locked":
      return `${partnerName} is locking in their answer…`;
    default:
      return `Waiting for ${partnerName}…`;
  }
}

export function WaitingScreen({
  partnerName,
  phase,
  chosenCategory,
  round,
  totalRounds,
  customMessage,
}: WaitingScreenProps) {
  const reduced = useReducedMotion();
  const pulseProps = lobbyPulse(reduced);

  const copy = getWaitingCopy(phase, partnerName, chosenCategory, customMessage);

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[55vh] gap-6 text-center"
      role="status"
      aria-live="polite"
      aria-label={copy}
    >
      {/* Animated orb */}
      <motion.div
        {...pulseProps}
        className="w-16 h-16 rounded-full bg-surface-sunken border-2 border-theme-subtle shadow-md"
        aria-hidden="true"
      />

      <div className="flex flex-col gap-2 max-w-sm">
        <p className="text-2xl text-ink-primary font-serif">{copy}</p>
        <p className="text-sm text-ink-tertiary">
          Round {round} of {totalRounds}
        </p>
      </div>
    </div>
  );
}
