import Link from "next/link";

export function Nav() {
  return (
    <header className="sticky top-0 z-30 bg-[var(--bg-base)]/90 backdrop-blur-sm border-b border-[var(--border-subtle)]">
      <nav className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between" aria-label="Main navigation">
        <Link href="/" className="flex items-center gap-2" aria-label="Twilight Chronicles home">
          <span className="font-display text-xl text-[var(--ink-primary)] font-medium">
            Twilight <span className="text-[var(--accent-ember)]">Chronicles</span>
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <Link href="/how-it-works" className="px-3 py-2 text-sm text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] transition-colors rounded-[var(--radius-sm)] hover:bg-[var(--bg-sunken)]">How it works</Link>
          <Link href="/faq" className="hidden sm:block px-3 py-2 text-sm text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] transition-colors rounded-[var(--radius-sm)] hover:bg-[var(--bg-sunken)]">FAQ</Link>
          <Link href="/create" className="ml-2 px-4 py-2 text-sm font-semibold bg-[var(--accent-ember)] text-white rounded-[var(--radius-sm)] hover:bg-[var(--accent-ember-hover)] transition-colors min-h-[36px] flex items-center">Start a Game</Link>
        </div>
      </nav>
    </header>
  );
}
