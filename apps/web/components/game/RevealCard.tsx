"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { CategoryId, ReactionId, AvatarId } from "@twilight/shared-types";
import { getCategoryColor } from "@/lib/theme/categories";
import { questionReveal, revealAnswerAppear } from "@/lib/theme/motion";
import { useReducedMotion } from "@/lib/a11y/useReducedMotion";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { Button } from "@/components/ui/Button";

const REACTIONS: { id: ReactionId; emoji: string; label: string }[] = [
  { id: "heart",      emoji: "❤️",  label: "Love this" },
  { id: "spark",      emoji: "✨",  label: "Spark" },
  { id: "soft",       emoji: "🥺",  label: "Soft" },
  { id: "same",       emoji: "💯",  label: "Same" },
  { id: "surprising", emoji: "😮",  label: "Surprising" },
];

interface RevealCardProps {
  question: string;
  category: CategoryId;
  answer: string;
  answeredBy: { name: string; avatar: AvatarId };
  onReact: (emoji: ReactionId) => void;
  onContinue: () => void;
  minDwellMs?: number;
}

export function RevealCard({
  question,
  category,
  answer,
  answeredBy,
  onReact,
  onContinue,
  minDwellMs = 1500,
}: RevealCardProps) {
  const reduced = useReducedMotion();
  const qAnim = questionReveal(reduced);
  const aAnim = revealAnswerAppear(reduced);
  const accentColor = getCategoryColor(category);

  const [dwellMet, setDwellMet] = useState(false);
  const [reacted, setReacted] = useState<ReactionId | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDwellMet(true), minDwellMs);
    return () => clearTimeout(t);
  }, [minDwellMs]);

  function handleReact(id: ReactionId) {
    setReacted(id);
    onReact(id);
  }

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-6">
      {/* Question */}
      <motion.div
        {...qAnim}
        className="rounded-[var(--radius-lg)] p-6 sm:p-8 bg-[var(--bg-elevated)]"
        style={{ borderTop: `3px solid ${accentColor}` }}
      >
        <p className="question-display text-[var(--ink-primary)]">{question}</p>
      </motion.div>

      {/* Answer */}
      <motion.div {...aAnim} className="flex flex-col gap-4">
        {/* Answered by */}
        <div className="flex items-center gap-2">
          <PlayerAvatar avatar={answeredBy.avatar} name={answeredBy.name} size="sm" />
          <span className="text-sm text-[var(--ink-tertiary)]">
            {answeredBy.name} answered
          </span>
        </div>

        {/* Answer text */}
        <div className="rounded-[var(--radius-md)] p-5 bg-[var(--bg-sunken)] border border-[var(--border-subtle)]">
          <p className="text-[var(--ink-primary)] text-base leading-relaxed whitespace-pre-wrap">
            {answer}
          </p>
        </div>

        {/* Reactions */}
        <div className="flex gap-2 flex-wrap" role="group" aria-label="React to this answer">
          {REACTIONS.map((r) => (
            <button
              key={r.id}
              onClick={() => handleReact(r.id)}
              aria-label={r.label}
              aria-pressed={reacted === r.id}
              className={`px-3 py-2 rounded-[var(--radius-sm)] text-lg border transition-all duration-100 min-h-[44px] min-w-[52px]
                ${reacted === r.id
                  ? "border-[var(--accent-ember)] bg-[var(--accent-ember-tint)] scale-110"
                  : "border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--accent-ember)]"
                }`}
            >
              {r.emoji}
            </button>
          ))}
        </div>

        {/* Continue */}
        {dwellMet && (
          <Button variant="primary" size="lg" onClick={onContinue} id="continue-btn">
            Continue
          </Button>
        )}
      </motion.div>
    </div>
  );
}
