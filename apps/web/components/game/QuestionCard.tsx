"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { CategoryId } from "@twilight/shared-types";
import { getCategoryColor } from "@/lib/theme/categories";
import {
  questionReveal,
  inkSettle,
  answerLockSettle,
  lockSeal,
  shareDrift,
  skipDriftExit,
  skipDriftEnter,
} from "@/lib/theme/motion";
import { useReducedMotion } from "@/lib/a11y/useReducedMotion";
import { SkipControl } from "@/components/ui/SkipControl";
import { Button } from "@/components/ui/Button";
import { pickCopy, HIGH_INTENSITY_LOCK_ACK } from "@/lib/copy/pools";

export type QuestionState = "revealed" | "typing" | "locked" | "shared";

interface QuestionCardProps {
  round: number;
  totalRounds: number;
  category: CategoryId;
  question: string;
  /** intensity 1-5, used to decide whether to show HIGH_INTENSITY_LOCK_ACK */
  intensity?: number;
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
  intensity = 3,
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
  const revealAnim  = questionReveal(reduced);
  const inkAnim     = inkSettle(reduced);
  const lockAnim    = answerLockSettle(reduced);
  const sealAnim    = lockSeal(reduced);
  const shareExit   = shareDrift(reduced);
  const skipExitAnim  = skipDriftExit(reduced);
  const skipEnterAnim = skipDriftEnter(reduced);
  const accentColor = getCategoryColor(category);

  const isLocked   = state === "locked";
  const isAnswering = state === "revealed" || state === "typing";

  // ── High-intensity lock acknowledgement line ────────────────────────────────
  // Picked fresh each time we enter the locked state; held stable while locked.
  const [lockAck, setLockAck] = useState<string | null>(null);
  const prevStatRef = useRef<QuestionState>(state);

  useEffect(() => {
    if (state === "locked" && prevStatRef.current !== "locked") {
      if (intensity >= 5) {
        setLockAck(pickCopy(HIGH_INTENSITY_LOCK_ACK));
      } else {
        setLockAck(null);
      }
    }
    prevStatRef.current = state;
  }, [state, intensity]);

  // ── Vibration on lock (feature-detected; no-op where unsupported) ───────────
  const handleLock = useCallback(() => {
    try {
      if ("vibrate" in navigator) {
        navigator.vibrate(12);
      }
    } catch {
      // iOS Safari throws — swallow silently
    }
    onLock();
  }, [onLock]);

  // ── Focus state for typing accent border ────────────────────────────────────
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-6 relative">
      {/* categoryEdgeGlow — low-opacity radial glow at screen edges */}
      {/* aria-hidden: purely decorative */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-500"
        style={{
          background: `radial-gradient(ellipse at 50% 50%, transparent 55%, ${accentColor} 100%)`,
          opacity: reduced ? 0.05 : undefined,
          animation: reduced ? undefined : "edgeGlowBreathe 5s ease-in-out infinite",
        }}
      />

      {/* Question display — questionReveal + inkSettle run concurrently */}
      <AnimatePresence mode="wait">
        <motion.div
          key={question}
          {...revealAnim}
          className="rounded-[var(--radius-lg)] p-6 sm:p-8 bg-[var(--bg-elevated)] shadow-[var(--shadow-sm)] relative z-10"
          style={{ borderTop: `3px solid ${accentColor}` }}
        >
          {/* inkSettle wraps the text node; aria-hidden so blur never hides text from SR */}
          <motion.p
            {...inkAnim}
            className="question-display text-[var(--ink-primary)]"
            // Text is in the a11y tree immediately (DOM present on mount); blur is purely visual
          >
            {question}
          </motion.p>
          {followUpPrompt && (
            <p className="mt-4 text-sm text-[var(--ink-tertiary)] italic">{followUpPrompt}</p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Answer area — shareDrift exit when state → "shared" */}
      <AnimatePresence mode="wait">
        {state !== "shared" && (
          <motion.div
            key="answer-area"
            layout
            {...(isLocked ? sealAnim : {})}
            transition={isLocked ? sealAnim.transition : lockAnim.transition}
            exit={shareExit.exit}
            className={`rounded-[var(--radius-md)] overflow-hidden border transition-colors duration-150 relative z-10 ${
              isLocked
                ? "border-[var(--accent-ember)] bg-[var(--accent-ember-tint)]"
                : isFocused
                ? "border-[var(--cat-color,var(--accent-ember))]"
                : "border-[var(--border-subtle)] bg-[var(--bg-elevated)]"
            }`}
            style={{
              "--cat-color": accentColor,
              ...(isFocused && !isLocked ? { borderColor: accentColor } : {}),
            } as React.CSSProperties}
          >
            <textarea
              value={draft}
              onChange={(e) => onDraftChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Type your answer here…"
              disabled={isLocked}
              aria-label="Your answer"
              rows={4}
              className="w-full p-4 text-[var(--ink-primary)] text-base bg-transparent resize-none outline-none placeholder:text-[var(--ink-tertiary)] disabled:cursor-default transition-colors"
            />

            {/* Lock state: edit link + optional high-intensity ack */}
            {isLocked && (
              <div className="px-4 pb-3 flex items-center justify-between gap-3">
                <button
                  onClick={onUnlockEdit}
                  className="text-xs text-[var(--ink-tertiary)] hover:text-[var(--accent-ember)] underline underline-offset-2 transition-colors"
                >
                  Edit answer
                </button>
                {/* High-intensity acknowledgement — intensity ≥ 5 only, answerer only, never broadcast */}
                {lockAck && (
                  <p className="text-xs text-[var(--ink-secondary)] italic">{lockAck}</p>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex flex-col gap-3 relative z-10">
        {isAnswering && (
          <>
            <Button
              variant="primary"
              size="lg"
              onClick={handleLock}
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

      {/* Edge glow keyframe (injected once) */}
      <style jsx global>{`
        @keyframes edgeGlowBreathe {
          0%, 100% { opacity: 0.04; }
          50%       { opacity: 0.08; }
        }
      `}</style>
    </div>
  );
}
