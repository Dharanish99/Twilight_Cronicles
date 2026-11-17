"use client";

import { useEffect, useState } from "react";

interface RevealRecoveryProps {
  connected: boolean;
  onRetry: () => void;
}

/** Shown instead of an empty stage if a client misses the shared-answer payload. */
export function RevealRecovery({ connected, onRetry }: RevealRecoveryProps) {
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(onRetry, 700);
    return () => window.clearTimeout(timer);
  }, [onRetry]);

  function retry() {
    setRetrying(true);
    onRetry();
    window.setTimeout(() => setRetrying(false), 1000);
  }

  return (
    <div
      className="mx-auto flex w-full max-w-md flex-col items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-6 py-8 text-center shadow-[var(--shadow-md)]"
      role="status"
      aria-live="polite"
    >
      <span
        className="h-2.5 w-2.5 animate-pulse rounded-full bg-[var(--accent-ember)]"
        aria-hidden="true"
      />
      <h2 className="font-display text-2xl text-[var(--ink-primary)]">
        Restoring the reveal…
      </h2>
      <p className="max-w-sm text-sm leading-relaxed text-[var(--ink-secondary)]">
        {connected
          ? "The answer is taking a moment to reach this screen. Your shared answer is safe; syncing the latest room state now."
          : "The connection dropped during the reveal. The shared answer is safe; reconnecting to restore it."}
      </p>
      <button
        type="button"
        onClick={retry}
        disabled={retrying}
        className="min-h-11 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-sunken)] px-5 py-2 text-sm font-semibold text-[var(--ink-primary)] transition-colors hover:border-[var(--accent-ember)] disabled:cursor-wait disabled:opacity-60"
      >
        {retrying ? "Syncing…" : "Retry sync"}
      </button>
    </div>
  );
}
