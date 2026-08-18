"use client";

/**
 * AnswerSentScreen — shown to the answerer while the picker reads their answer.
 *
 * Displays a category-matched literary quote from the public-domain pool.
 * Quote is picked once on mount; usedIds set is managed in play/page.tsx
 * so quotes don't repeat across turns within a session.
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { CategoryId } from "@twilight/shared-types";
import { pickQuote, type Quote } from "@/lib/copy/quotePool";
import { useReducedMotion } from "@/lib/a11y/useReducedMotion";

interface AnswerSentScreenProps {
  partnerName: string;
  category: CategoryId;
  /** Session-level set of already-shown quote IDs — prevents repeats within a session */
  usedQuoteIds: Set<string>;
  onQuoteShown: (id: string) => void;
}

export function AnswerSentScreen({
  partnerName,
  category,
  usedQuoteIds,
  onQuoteShown,
}: AnswerSentScreenProps) {
  const reduced = useReducedMotion();
  const [quote, setQuote] = useState<Quote | null>(null);

  useEffect(() => {
    const q = pickQuote(category, usedQuoteIds);
    setQuote(q);
    onQuoteShown(q.id);
    // Only pick once per mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const fadeUp = reduced
    ? {}
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.35, ease: "easeOut" as const },
      };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-8 text-center py-12">
      {/* Ember check mark */}
      <motion.div
        {...(reduced ? {} : { initial: { scale: 0.8, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } })}
        className="w-16 h-16 rounded-full bg-[var(--accent-ember-tint)] flex items-center justify-center"
        aria-hidden="true"
      >
        {/* SVG check — no emoji */}
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-ember)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </motion.div>

      {/* Heading */}
      <motion.div {...fadeUp} className="flex flex-col gap-2">
        <h2 className="font-display text-2xl sm:text-3xl text-[var(--ink-primary)]">
          Answer Sent
        </h2>
        <p className="text-sm text-[var(--ink-secondary)] max-w-xs mx-auto">
          {partnerName} is reading your answer right now…
        </p>
      </motion.div>

      {/* Literary quote */}
      {quote && (
        <motion.blockquote
          {...(reduced ? {} : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.4, delay: 0.2, ease: "easeOut" } })}
          className="mt-2 px-7 py-5 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] max-w-sm text-left"
        >
          {/* Quote text — italic, Fraunces-adjacent */}
          <p className="font-display text-base italic leading-relaxed text-[var(--ink-secondary)]">
            &ldquo;{quote.text}&rdquo;
          </p>

          {/* Attribution */}
          <footer className="mt-3 flex flex-col gap-0.5">
            <cite className="not-italic text-sm font-semibold text-[var(--ink-primary)]">
              — {quote.author}
            </cite>
            {/* Only render work if it's non-null — never render "(null)" */}
            {quote.work && (
              <span className="text-xs text-[var(--ink-tertiary)]">
                {quote.work}
              </span>
            )}
          </footer>
        </motion.blockquote>
      )}

      {/* Waiting pulse */}
      <p className="text-xs text-[var(--ink-tertiary)] animate-pulse">
        Waiting for {partnerName} to continue…
      </p>
    </div>
  );
}
