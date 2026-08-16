"use client";
import { motion, AnimatePresence } from "framer-motion";
import type { CategoryId } from "@twilight/shared-types";
import { getCategoryColor } from "@/lib/theme/categories";
import { questionReveal, answerLockSettle } from "@/lib/theme/motion";
import { useReducedMotion } from "@/lib/a11y/useReducedMotion";
import { SkipControl } from "@/components/ui/SkipControl";
import { Button } from "@/components/ui/Button";

export type QuestionState = "revealed" | "typing" | "locked" | "shared";

interface QuestionCardProps {
  round: number;
  totalRounds: number;
  category: CategoryId;
  question: string;
  state: QuestionState;
  draft: string;
  onDraftChange: (v: string) => void;
  onLock: () => void;
  onShare: (partnerName: string) => void;
  onSkip: () => void;
  onUnlockEdit: () => void;
  partnerName?: string;
  timer?: { secondsRemaining: number; total: number } | null;
  followUpPrompt?: string | null;
}

export function QuestionCard({
  round,
  totalRounds,
  category,
  question,
  state,
  draft,
  onDraftChange,
  onLock,
  onShare,
  onSkip,
  onUnlockEdit,
  partnerName = "them",
  timer,
  followUpPrompt,
}: QuestionCardProps) {
  const reduced = useReducedMotion();
  const revealAnim = questionReveal(reduced);
  const lockAnim = answerLockSettle(reduced);
  const accentColor = getCategoryColor(category);

  const isLocked = state === "locked";
  const isAnswering = state === "revealed" || state === "typing";

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-6">
      {/* Question display */}
      <motion.div
        key={question}
        {...revealAnim}
        className="rounded-[var(--radius-lg)] p-6 sm:p-8 bg-[var(--bg-elevated)] shadow-[var(--shadow-sm)]"
        style={{ borderTop: `3px solid ${accentColor}` }}
      >
        <p className="question-display text-[var(--ink-primary)]">{question}</p>
        {followUpPrompt && (
          <p className="mt-4 text-sm text-[var(--ink-tertiary)] italic">{followUpPrompt}</p>
        )}
      </motion.div>

      {/* Answer area */}
      <motion.div
        layout
        transition={lockAnim.transition}
        className={`rounded-[var(--radius-md)] overflow-hidden border transition-colors duration-150 ${
          isLocked
            ? "border-[var(--accent-ember)] bg-[var(--accent-ember-tint)]"
            : "border-[var(--border-subtle)] bg-[var(--bg-elevated)]"
        }`}
      >
        <textarea
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          placeholder="Type your answer here…"
          disabled={isLocked}
          aria-label="Your answer"
          rows={4}
          className="w-full p-4 text-[var(--ink-primary)] text-base bg-transparent resize-none outline-none placeholder:text-[var(--ink-tertiary)] disabled:cursor-default"
        />
        {isLocked && (
          <div className="px-4 pb-2">
            <button
              onClick={onUnlockEdit}
              className="text-xs text-[var(--ink-tertiary)] hover:text-[var(--accent-ember)] underline underline-offset-2 transition-colors"
            >
              Edit answer
            </button>
          </div>
        )}
      </motion.div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        {isAnswering && (
          <>
            <Button
              variant="primary"
              size="lg"
              onClick={onLock}
              disabled={!draft.trim()}
              id="lock-answer-btn"
            >
              Lock it in
            </Button>
            <div className="flex justify-center">
              <SkipControl onSkip={onSkip} />
            </div>
          </>
        )}
        {isLocked && (
          <Button
            variant="primary"
            size="lg"
            onClick={() => onShare(partnerName)}
            id="share-answer-btn"
          >
            Share with {partnerName}
          </Button>
        )}
      </div>
    </div>
  );
}
