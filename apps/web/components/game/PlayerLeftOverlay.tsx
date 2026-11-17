"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useReducedMotion } from "@/lib/a11y/useReducedMotion";

interface PlayerLeftOverlayProps {
  partnerName: string;
  onDismiss: () => void;
}

export function PlayerLeftOverlay({ partnerName, onDismiss }: PlayerLeftOverlayProps) {
  const router  = useRouter();
  const reduced = useReducedMotion();

  function handleEndSession() {
    router.push("/");
  }

  function handleWait() {
    onDismiss();
  }

  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
      animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-6"
      role="alertdialog"
      aria-modal="true"
      aria-label={`${partnerName} has left`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[var(--bg-base)] bg-opacity-90 backdrop-blur-md" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm bg-[var(--bg-elevated)] rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)] border border-[var(--border-subtle)] overflow-hidden">
        {/* Ember tint strip at top */}
        <div
          className="h-1.5 w-full"
          style={{ background: "linear-gradient(90deg, var(--accent-ember), var(--cat-emotional))" }}
          aria-hidden="true"
        />

        <div className="px-6 py-7 flex flex-col items-center gap-6 text-center">
          {/* Icon — a simple open door SVG, no emoji */}
          <div
            className="w-16 h-16 rounded-full bg-[var(--bg-sunken)] flex items-center justify-center"
            aria-hidden="true"
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--ink-secondary)"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Door */}
              <path d="M18 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1z" />
              {/* Handle */}
              <circle cx="15" cy="12" r="0.8" fill="var(--ink-secondary)" />
              {/* Arrow going out */}
              <path d="M10 12h-5m0 0l2-2m-2 2l2 2" stroke="var(--accent-ember)" />
            </svg>
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="font-display text-xl text-[var(--ink-primary)]">
              {partnerName} has left
            </h2>
            <p className="text-sm text-[var(--ink-secondary)] max-w-xs leading-relaxed">
              They stepped away from the session. You can end now or keep the room open while they reconnect.
            </p>
          </div>

          <div className="w-full flex flex-col gap-2">
            <button
              onClick={handleEndSession}
              className="w-full py-3 bg-[var(--accent-ember)] text-white font-semibold rounded-[var(--radius-md)] hover:opacity-90 active:scale-95 transition-all"
              id="end-session-btn"
            >
              End session
            </button>
            <button
              onClick={handleWait}
              className="w-full py-2.5 bg-[var(--bg-sunken)] text-[var(--ink-secondary)] font-medium rounded-[var(--radius-md)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] transition-colors"
              id="wait-a-moment-btn"
            >
              Wait a moment
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
