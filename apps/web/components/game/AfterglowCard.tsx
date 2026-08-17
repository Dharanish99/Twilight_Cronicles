"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import type { CategoryId } from "@twilight/shared-types";
import { CATEGORIES, getCategoryColor } from "@/lib/theme/categories";
import { afterglowDevelop } from "@/lib/theme/motion";
import { useReducedMotion } from "@/lib/a11y/useReducedMotion";
import { CategoryIcon } from "@/components/ui/CategoryIcon";

interface AfterglowCardProps {
  categoriesUsed: CategoryId[];
  roundsCompleted: number;
  durationSeconds: number;
}

/**
 * AfterglowCard — a downloadable recap card that resolves from desaturated+blurred
 * to full color, like a photograph developing.
 *
 * INTENTIONALLY excludes: question text, answer text, player names.
 * Contains only: category color chips, round count, duration, wordmark.
 */
export function AfterglowCard({ categoriesUsed, roundsCompleted, durationSeconds }: AfterglowCardProps) {
  const reduced = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const developAnim = afterglowDevelop(reduced);
  const minutes = Math.floor(durationSeconds / 60);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    // Dynamic import — only pulled in when user clicks Download
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas: HTMLCanvasElement = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
      });
      const link = document.createElement("a");
      link.download = `twilight-chronicles-recap.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      // html2canvas not available in all environments — fail gracefully
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* The card itself — this is what gets captured as PNG */}
      <motion.div
        ref={cardRef}
        {...developAnim}
        className="w-full max-w-sm rounded-[var(--radius-lg)] overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg-sunken) 100%)",
          border: "1px solid var(--border-subtle)",
          padding: "28px 24px",
        }}
      >
        {/* Wordmark */}
        <div className="mb-6">
          <span className="font-display text-lg text-[var(--ink-primary)]">
            Twilight <span style={{ color: "var(--accent-ember)" }}>Chronicles</span>
          </span>
        </div>

        {/* Stats row */}
        <div className="flex gap-6 mb-6">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[var(--ink-tertiary)] font-semibold">Questions</p>
            <p className="font-display text-3xl text-[var(--ink-primary)] font-semibold">{roundsCompleted}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[var(--ink-tertiary)] font-semibold">Duration</p>
            <p className="font-display text-3xl text-[var(--ink-primary)] font-semibold">~{minutes}m</p>
          </div>
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-2">
          {categoriesUsed.map((catId) => {
            const def = CATEGORIES[catId as keyof typeof CATEGORIES];
            const color = getCategoryColor(catId as CategoryId);
            return (
              <div
                key={catId}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
                style={{
                  background: `${color}18`,
                  border: `1px solid ${color}40`,
                  color,
                }}
              >
                <CategoryIcon category={catId as CategoryId} size={11} />
                {def?.label ?? catId}
              </div>
            );
          })}
        </div>

        {/* Tagline */}
        <p className="mt-5 text-[11px] text-[var(--ink-tertiary)] italic">
          An evening of honest, unhurried conversation.
        </p>
      </motion.div>

      {/* Download button — outside the captured area */}
      <button
        type="button"
        onClick={handleDownload}
        id="download-recap-btn"
        className="text-xs font-semibold text-[var(--ink-secondary)] hover:text-[var(--accent-ember)] underline underline-offset-2 transition-colors"
      >
        Download recap as image
      </button>
    </div>
  );
}
