"use client";

import Link from "next/link";
import { ArrowLeft, Bookmark, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface HighlightItem {
  id: string;
  question: string;
  category: string;
  answerSnippet: string;
  date: string;
}

const SAMPLE_HIGHLIGHTS: HighlightItem[] = [
  {
    id: "hl-1",
    question: "When do you feel most like yourself?",
    category: "Deep",
    answerSnippet: "Sitting on the porch at dawn with coffee before the rest of the world wakes up.",
    date: "Yesterday",
  },
  {
    id: "hl-2",
    question: "What is a small thing someone did for you that you still think about?",
    category: "Emotional",
    answerSnippet: "Leaving a handwritten note on my steering wheel when I had that terrible week in March.",
    date: "3 days ago",
  },
];

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
        <span className="category-label text-[var(--accent-ember)]">
          Saved Moments
        </span>
      </header>

      <main className="max-w-2xl mx-auto w-full my-auto py-8 flex flex-col gap-6">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl text-[var(--ink-primary)]">
            Your Highlights
          </h1>
          <p className="text-[var(--ink-secondary)] text-sm mt-1">
            Bookmarked answers from your past conversations. Encrypted at rest.
          </p>
        </div>

        {SAMPLE_HIGHLIGHTS.length > 0 ? (
          <div className="flex flex-col gap-4">
            {SAMPLE_HIGHLIGHTS.map((hl) => (
              <div
                key={hl.id}
                className="p-5 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex flex-col gap-3"
              >
                <div className="flex justify-between items-center text-xs">
                  <span className="category-label text-[var(--accent-ember)]">
                    {hl.category}
                  </span>
                  <span className="text-[var(--ink-tertiary)]">{hl.date}</span>
                </div>
                <p className="font-medium text-base text-[var(--ink-primary)]">
                  &quot;{hl.question}&quot;
                </p>
                <p className="text-sm text-[var(--ink-secondary)] italic bg-[var(--bg-sunken)] p-3 rounded-[var(--radius-sm)]">
                  {hl.answerSnippet}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 flex flex-col items-center gap-3">
            <Bookmark size={32} className="text-[var(--ink-tertiary)]" />
            <p className="text-base text-[var(--ink-secondary)]">No highlights saved yet.</p>
            <p className="text-xs text-[var(--ink-tertiary)]">
              When you finish a session, you can bookmark special moments here.
            </p>
          </div>
        )}

        <div className="flex justify-center pt-4">
          <Link href="/create">
            <Button variant="primary" size="md">
              <Sparkles size={16} className="mr-2" /> Start a New Game
            </Button>
          </Link>
        </div>
      </main>

      <footer className="max-w-2xl mx-auto w-full text-center py-4 text-xs text-[var(--ink-tertiary)]">
        Highlights are stored securely and only accessible on this device.
      </footer>
    </div>
  );
}
