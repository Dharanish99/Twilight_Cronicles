"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { Sparkles, RotateCcw, Home } from "lucide-react";
import { useGameStore } from "@/lib/state/gameStore";
import { Button } from "@/components/ui/Button";
import { CATEGORIES } from "@/lib/theme/categories";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { ToastContainer } from "@/components/ui/Toast";
import { AfterglowCard } from "@/components/game/AfterglowCard";

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
    leaveRoom,
    localPlayer,
    initSocketListeners,
    resumeRoom,
  } = useGameStore();

  useEffect(() => {
    initSocketListeners();
  }, [initSocketListeners]);

  useEffect(() => {
    if (!room && localPlayer?.sessionToken && localPlayer.roomId === roomId) resumeRoom();
  }, [room, localPlayer, roomId, resumeRoom]);

  const roundsCompleted = gameCompletedData?.roundsCompleted ?? (room?.status === "completed" ? room.turn.round : null);
  const categoriesUsed = gameCompletedData?.categoriesUsed ?? room?.usedCategories ?? [];
  const durationSeconds = gameCompletedData?.durationSeconds ?? (
    room?.startedAt && room.completedAt
      ? Math.max(0, Math.floor((Date.parse(room.completedAt) - Date.parse(room.startedAt)) / 1000))
      : null
  );
  const minutes = durationSeconds === null ? null : Math.floor(durationSeconds / 60);

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
            {roundsCompleted === null
              ? "Your room is no longer available on this tab."
              : `You completed ${roundsCompleted} rounds of honest, unhurried conversation.`}
          </p>
        </div>

        {/* Stats Summary Card */}
        <div className="grid grid-cols-2 gap-4 w-full">
          <div className="p-5 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <span className="category-label text-[var(--ink-tertiary)]">Conversation Time</span>
            <p className="font-display text-3xl font-semibold text-[var(--ink-primary)] mt-1">
              {minutes === null ? "—" : `~${minutes}m`}
            </p>
          </div>

          <div className="p-5 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <span className="category-label text-[var(--ink-tertiary)]">Rounds Completed</span>
            <p className="font-display text-3xl font-semibold text-[var(--ink-primary)] mt-1">
              {roundsCompleted ?? "—"}
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
              const def = CATEGORIES[catId];
              return (
                <div
                  key={catId}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs"
                >
                  <CategoryIcon category={catId} size={14} />
                  <span className="font-medium text-[var(--ink-primary)]">
                    {def?.label ?? catId}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Afterglow recap card — develops from desaturated to full colour */}
        {roundsCompleted !== null && durationSeconds !== null && (
          <AfterglowCard
            categoriesUsed={categoriesUsed}
            roundsCompleted={roundsCompleted}
            durationSeconds={durationSeconds}
          />
        )}

        {/* Action Controls */}
        <div className="flex flex-col gap-3 w-full max-w-sm mt-2">
          <Link href="/create" onClick={() => leaveRoom()} className="w-full">
            <Button variant="primary" size="lg" id="play-again-btn">
              <RotateCcw size={18} className="mr-2" /> Start Another Game
            </Button>
          </Link>

          <Link href="/" onClick={() => leaveRoom()} className="w-full">
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
