"use client";

import Link from "next/link";
import { ArrowLeft, Bookmark, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function HistoryPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--ink-primary)] flex flex-col justify-between p-5 sm:p-8">
      <header className="max-w-2xl mx-auto w-full flex items-center justify-between py-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] transition-colors"
        >
          <ArrowLeft size={16} /> Back to Home
        </Link>
        <span className="category-label text-[var(--accent-ember)]">Saved Moments</span>
      </header>

      <main className="max-w-2xl mx-auto w-full my-auto py-8 flex flex-col gap-6">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl text-[var(--ink-primary)]">Your Highlights</h1>
          <p className="text-[var(--ink-secondary)] text-sm mt-1">
            Answers are shared in the room and then expire with the session. Highlight saving is not available yet.
          </p>
        </div>

        <div className="text-center py-16 px-6 flex flex-col items-center gap-3 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
          <Bookmark size={32} className="text-[var(--ink-tertiary)]" aria-hidden="true" />
          <p className="text-base text-[var(--ink-secondary)]">There are no saved highlights.</p>
          <p className="text-xs text-[var(--ink-tertiary)] max-w-sm">
            This page will show saved moments when that feature is available. It does not contain sample or placeholder answers.
          </p>
        </div>

        <div className="flex justify-center pt-4">
          <Link href="/create">
            <Button variant="primary" size="md">
              <Sparkles size={16} className="mr-2" /> Start a New Game
            </Button>
          </Link>
        </div>
      </main>

      <footer className="max-w-2xl mx-auto w-full text-center py-4 text-xs text-[var(--ink-tertiary)]">
        Twilight Chronicles does not store a personal answer history yet.
      </footer>
    </div>
  );
}
