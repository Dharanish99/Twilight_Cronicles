"use client";

import Link from "next/link";
import { ArrowLeft, User, ShieldCheck } from "lucide-react";
import { useGameStore } from "@/lib/state/gameStore";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { Button } from "@/components/ui/Button";

export default function ProfilePage() {
  const { localPlayer } = useGameStore();

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--ink-primary)] flex flex-col justify-between p-5 sm:p-8">
      <header className="max-w-xl mx-auto w-full flex items-center justify-between py-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] transition-colors"
        >
          <ArrowLeft size={16} /> Back to Home
        </Link>
        <span className="category-label text-[var(--accent-ember)]">Player Profile</span>
      </header>

      <main className="max-w-md mx-auto w-full my-auto py-8 flex flex-col items-center gap-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <PlayerAvatar
            avatar={localPlayer?.avatar ?? "ember"}
            name={localPlayer?.displayName ?? "Guest Player"}
            size="lg"
          />
          <h1 className="font-display text-2xl sm:text-3xl text-[var(--ink-primary)]">
            {localPlayer?.displayName || "Guest Player"}
          </h1>
          <span className="inline-flex items-center gap-1.5 text-xs text-[var(--success)] bg-[var(--success)]/10 px-3 py-1 rounded-full font-medium">
            <ShieldCheck size={14} /> Anonymous Session Active
          </span>
        </div>

        <div className="p-5 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] w-full text-left flex flex-col gap-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-[var(--ink-secondary)]">Preferred Avatar</span>
            <span className="font-semibold capitalize text-[var(--ink-primary)]">
              {localPlayer?.avatar || "Ember"}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-[var(--ink-secondary)]">Active Room</span>
            <span className="font-semibold text-[var(--ink-primary)]">
              None
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <Link href="/create" className="w-full">
            <Button variant="primary" size="lg">
              Start a New Game
            </Button>
          </Link>
          <Link href="/history" className="w-full">
            <Button variant="secondary" size="lg">
              View Saved Highlights
            </Button>
          </Link>
        </div>
      </main>

      <footer className="max-w-xl mx-auto w-full text-center py-4 text-xs text-[var(--ink-tertiary)]">
        Twilight Chronicles • Privacy First
      </footer>
    </div>
  );
}
