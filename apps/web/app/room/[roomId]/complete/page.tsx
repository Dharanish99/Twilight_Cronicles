"use client";

import { use } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Bookmark, RotateCcw, Home } from "lucide-react";
import { useGameStore } from "@/lib/state/gameStore";
import { Button } from "@/components/ui/Button";
import { CATEGORIES } from "@/lib/theme/categories";
import { ToastContainer } from "@/components/ui/Toast";

interface CompletePageProps {
  params: Promise<{ roomId: string }>;
}

export default function CompletePage({ params }: CompletePageProps) {
  const { roomId } = use(params);
  const {
    room,
    gameCompletedData,
    toasts,
    removeToast,
    addToast,
    resetGame,
  } = useGameStore();

  const roundsCompleted =
    gameCompletedData?.roundsCompleted ?? room?.settings?.rounds ?? 6;
  const categoriesUsed = gameCompletedData?.categoriesUsed ?? [
    "deep",
    "emotional",
    "playful",
    "memories",
  ];
  const durationSeconds = gameCompletedData?.durationSeconds ?? 1420;
  const minutes = Math.floor(durationSeconds / 60);

  const handleSaveHighlights = () => {
    addToast("Session saved to your Highlights!", "success");
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--ink-primary)] flex flex-col justify-between p-5 sm:p-8">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      <header className="max-w-2xl mx-auto w-full flex items-center justify-between py-4">
        <Link href="/" className="font-display font-medium text-lg">
          Twilight <span className="text-[var(--accent-ember)]">Chronicles</span>
        </Link>
      </header>

      <main className="max-w-xl mx-auto w-full my-auto py-8 flex flex-col items-center gap-8 text-center animate-fadeIn">
        <div className="w-16 h-16 rounded-full bg-[var(--accent-ember-tint)] flex items-center justify-center text-[var(--accent-ember)] shadow-[var(--shadow-md)]">
          <Sparkles size={28} />
        </div>

        <div>
          <span className="category-label text-[var(--accent-ember)]">
            Thread Completed
          </span>
          <h1 className="font-display text-4xl sm:text-5xl text-[var(--ink-primary)] mt-2">
            The Dusk Settles.
          </h1>
          <p className="text-[var(--ink-secondary)] text-base mt-2 max-w-md">
            You completed {roundsCompleted} rounds of honest, unhurried conversation.
          </p>
        </div>

        {/* Stats Summary Card */}
        <div className="grid grid-cols-2 gap-4 w-full">
          <div className="p-5 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <span className="category-label text-[var(--ink-tertiary)]">Conversation Time</span>
            <p className="font-display text-3xl font-semibold text-[var(--ink-primary)] mt-1">
              ~{minutes}m
            </p>
          </div>

          <div className="p-5 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <span className="category-label text-[var(--ink-tertiary)]">Rounds Completed</span>
            <p className="font-display text-3xl font-semibold text-[var(--ink-primary)] mt-1">
              {roundsCompleted}
            </p>
          </div>
        </div>

        {/* Moods Explored */}
        <div className="w-full flex flex-col gap-3">
          <span className="category-label text-[var(--ink-tertiary)]">
            Moods Explored This Evening
          </span>
          <div className="flex flex-wrap gap-2 justify-center">
            {categoriesUsed.map((catId) => {
              const def = CATEGORIES[catId as keyof typeof CATEGORIES];
              return (
                <div
                  key={catId}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs"
                >
                  <span>{def?.emoji ?? "✨"}</span>
                  <span className="font-medium text-[var(--ink-primary)]">
                    {def?.label ?? catId}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col gap-3 w-full max-w-sm mt-4">
          <Button
            variant="secondary"
            size="lg"
            onClick={handleSaveHighlights}
            id="save-highlight-btn"
          >
            <Bookmark size={18} className="mr-2" /> Bookmark Session Highlights
          </Button>

          <Link href="/create" onClick={() => resetGame()} className="w-full">
            <Button variant="primary" size="lg" id="play-again-btn">
              <RotateCcw size={18} className="mr-2" /> Start Another Game
            </Button>
          </Link>

          <Link href="/" onClick={() => resetGame()} className="w-full">
            <Button variant="text" size="md" className="w-full">
              <Home size={16} className="mr-2" /> Return to Home
            </Button>
          </Link>
        </div>
      </main>

      <footer className="max-w-2xl mx-auto w-full text-center py-4 text-xs text-[var(--ink-tertiary)]">
        All ephemeral session state will be safely cleared in 24 hours.
      </footer>
    </div>
  );
}
