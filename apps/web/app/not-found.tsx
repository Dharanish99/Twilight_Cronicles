import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 text-center gap-6 bg-[var(--bg-base)]">
      <span className="font-display text-8xl text-[var(--border-subtle)] select-none" aria-hidden="true">
        404
      </span>
      <div className="flex flex-col gap-2 max-w-md">
        <h1 className="font-display text-3xl text-[var(--ink-primary)]">
          This room seems quiet.
        </h1>
        <p className="text-[var(--ink-secondary)] text-base">
          The page or session link you followed doesn&apos;t exist or may have already expired.
        </p>
      </div>
      <div className="flex gap-3 mt-4">
        <Link
          href="/"
          className="px-6 py-3 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--ink-primary)] rounded-[var(--radius-sm)] font-medium hover:border-[var(--accent-ember)] transition-colors min-h-[44px] flex items-center"
        >
          Return Home
        </Link>
        <Link
          href="/create"
          className="px-6 py-3 bg-[var(--accent-ember)] text-white rounded-[var(--radius-sm)] font-semibold hover:bg-[var(--accent-ember-hover)] transition-colors min-h-[44px] flex items-center"
        >
          Start a Game
        </Link>
      </div>
    </div>
  );
}
