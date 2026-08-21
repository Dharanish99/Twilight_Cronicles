"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { CategoryId, ReactionId, AvatarId } from "@twilight/shared-types";
import { getCategoryColor } from "@/lib/theme/categories";
import { inkSettle, revealAnswerAppear, reactionBloom } from "@/lib/theme/motion";
import { useReducedMotion } from "@/lib/a11y/useReducedMotion";
import { Sigil } from "@/components/ui/Sigil";
import { Button } from "@/components/ui/Button";
import { ReactionIcon, type ReactionVariant } from "@/components/ui/ReactionIcon";

// Maps ReactionId → SVG variant + label
const REACTIONS: { id: ReactionId; variant: ReactionVariant; label: string }[] = [
  { id: "heart",      variant: "heart", label: "Love this" },
  { id: "spark",      variant: "spark", label: "This sparks something" },
  { id: "soft",       variant: "soft",  label: "Soft" },
  { id: "same",       variant: "blush", label: "Same" },
  { id: "surprising", variant: "wow",   label: "Surprising" },
];

interface RevealCardProps {
  question: string;
  category: CategoryId;
  answer: string;
  answeredBy: { name: string; avatar: AvatarId };
  onReact: (reaction: ReactionId) => void;
  onContinue: () => void;
  /** Minimum ms before Continue appears — prevents accidental double-tap */
  minDwellMs?: number;
}

export function RevealCard({
  question,
  category,
  answer,
  answeredBy,
  onReact,
  onContinue,
  minDwellMs = 1800,
}: RevealCardProps) {
  const reduced    = useReducedMotion();
  const inkAnim    = inkSettle(reduced);
  const answerAnim = revealAnswerAppear(reduced);
  const bloomAnim  = reactionBloom(reduced);
  const accent     = getCategoryColor(category);

  const [dwellMet, setDwellMet]  = useState(false);
  const [reacted, setReacted]    = useState<ReactionId | null>(null);
  const [bloomKey, setBloomKey]  = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setDwellMet(true), minDwellMs);
    return () => clearTimeout(t);
  }, [minDwellMs]);

  function handleReact(id: ReactionId) {
    setReacted(id);
    setBloomKey((k) => k + 1);
    onReact(id);
  }

  // Derive sigil seed from avatar + name (stable per session)
  const sigilSeed = answeredBy.avatar + answeredBy.name;

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-5">

      {/* ── Question recap — muted context, not content ─────────────────── */}
      {/* Fades in first (150ms), then answer follows after a deliberate pause */}
      <motion.p
        initial={reduced ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="text-sm text-[var(--ink-secondary)] text-center italic leading-snug px-4"
        aria-label={`Question: ${question}`}
      >
        {question}
      </motion.p>

      {/* ── Answer hero card ─────────────────────────────────────────────── */}
      {/* inkSettle + revealAnswerAppear both run after a 300ms delay so the  */}
      {/* question recap lands visibly first.                                 */}
      <motion.div
        {...answerAnim}
        transition={reduced ? { duration: 0 } : { duration: 0.35, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] shadow-[var(--shadow-md)] overflow-hidden relative"
        style={{ border: `1px solid ${accent}40` }}
      >
        {/* Category accent radial wash — top-left, 7% opacity */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 0% 0%, ${accent}12 0%, transparent 55%)`,
          }}
        />

        <div className="relative z-10 p-6 sm:p-8 flex flex-col gap-5">
          {/* Attribution row */}
          <div className="flex items-center gap-2.5">
            <Sigil seed={sigilSeed} size={28} avatarId={answeredBy.avatar} />
            <span className="text-xs uppercase tracking-widest text-[var(--ink-secondary)] font-semibold">
              {answeredBy.name}&rsquo;s answer
            </span>
          </div>

          {/* Answer text — hero size */}
          <div className="relative">
            <motion.p
              {...inkAnim}
              transition={reduced ? { duration: 0 } : { duration: 0.35, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-[1.35rem] sm:text-2xl text-[var(--ink-primary)] leading-relaxed"
            >
              {answer}
            </motion.p>

            {/* Reaction bloom — fires on tap, aria-hidden */}
            <AnimatePresence>
              {reacted && (
                <motion.div
                  key={bloomKey}
                  {...bloomAnim}
                  aria-hidden="true"
                  className="absolute inset-0 rounded-[var(--radius-sm)] pointer-events-none"
                  style={{ background: accent }}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Reaction strip — custom SVG icons, no emoji */}
          <div
            role="group"
            aria-label="React to this answer"
            className="flex gap-2 flex-wrap"
          >
            {REACTIONS.map((r) => {
              const isSelected = reacted === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => handleReact(r.id)}
                  aria-label={r.label}
                  aria-pressed={isSelected}
                  className={`
                    flex items-center justify-center min-h-[44px] min-w-[52px] px-3 py-2
                    rounded-[var(--radius-sm)] border transition-all duration-200
                    ${isSelected
                      ? "border-[var(--accent-ember)] bg-[var(--accent-ember-tint)] scale-110"
                      : "border-[var(--border-subtle)] bg-[var(--bg-sunken)] hover:border-[var(--accent-ember)] hover:scale-105"
                    }
                  `}
                  style={{ color: isSelected ? accent : "var(--ink-secondary)" }}
                >
                  <ReactionIcon
                    variant={r.variant}
                    filled={isSelected}
                    accentColor={accent}
                    size={20}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* ── Continue ─────────────────────────────────────────────────────── */}
      {dwellMet && (
        <Button variant="primary" size="lg" onClick={onContinue} id="continue-btn">
          Continue
        </Button>
      )}
    </div>
  );
}
