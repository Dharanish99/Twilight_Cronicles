"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Moon, Sun, Volume2, LogOut, Copy, Check } from "lucide-react";
import { useThemeStore } from "@/lib/state/themeStore";
import { useGameStore } from "@/lib/state/gameStore";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { ToastContainer } from "@/components/ui/Toast";

interface SettingsPageProps {
  params: Promise<{ roomId: string }>;
}

export default function RoomSettingsPage({ params }: SettingsPageProps) {
  const { roomId } = use(params);
  const router = useRouter();

  const { theme, toggleTheme } = useThemeStore();
  const { toasts, removeToast, addToast, resetGame } = useGameStore();

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/join?code=${roomId}`
      : "";

  const handleCopyLink = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    addToast("Invite link copied!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExitRoom = () => {
    resetGame();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--ink-primary)] flex flex-col justify-between p-5 sm:p-8">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      <header className="max-w-xl mx-auto w-full flex items-center justify-between py-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] transition-colors"
        >
          <ArrowLeft size={16} /> Return to Game
        </button>
        <span className="category-label text-[var(--ink-tertiary)]">
          Room {roomId}
        </span>
      </header>

      <main className="max-w-md mx-auto w-full my-auto py-6 flex flex-col gap-6">
        <div>
          <h1 className="font-display text-3xl text-[var(--ink-primary)]">
            Session Settings
          </h1>
          <p className="text-[var(--ink-secondary)] text-sm mt-1">
            Adjust your experience during this conversation.
          </p>
        </div>

        {/* Theme Setting */}
        <div className="p-4 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            {theme === "dusk" ? (
              <Moon size={20} className="text-[var(--accent-ember)]" />
            ) : (
              <Sun size={20} className="text-[var(--cat-playful)]" />
            )}
            <div>
              <p className="text-sm font-semibold text-[var(--ink-primary)]">
                Appearance
              </p>
              <p className="text-xs text-[var(--ink-tertiary)] capitalize">
                {theme === "dusk" ? "Dusk Mode (Dark)" : "Daylight Mode (Warm)"}
              </p>
            </div>
          </div>
          <Button variant="secondary" size="md" onClick={toggleTheme}>
            Toggle
          </Button>
        </div>

        {/* Audio Setting */}
        <div className="p-4 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Volume2 size={20} className="text-[var(--ink-secondary)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--ink-primary)]">
                Subtle Haptics &amp; Audio
              </p>
              <p className="text-xs text-[var(--ink-tertiary)]">
                {soundEnabled ? "Enabled" : "Muted"}
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="md"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? "Mute" : "Enable"}
          </Button>
        </div>

        {/* Share Link */}
        <div className="p-4 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex flex-col gap-2">
          <p className="text-sm font-semibold text-[var(--ink-primary)]">
            Room Code &amp; Link
          </p>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-sm bg-[var(--bg-sunken)] px-3 py-2 rounded flex-1 text-center border border-[var(--border-subtle)]">
              {roomId}
            </span>
            <Button variant="secondary" size="md" onClick={handleCopyLink}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </Button>
          </div>
        </div>

        {/* Exit Room */}
        <div className="pt-4">
          <Button
            variant="secondary"
            size="lg"
            className="!text-[var(--danger)] hover:!bg-[var(--danger-tint)]"
            onClick={() => setShowExitDialog(true)}
          >
            <LogOut size={16} className="mr-2" /> Leave Session
          </Button>
        </div>
      </main>

      <Dialog
        open={showExitDialog}
        title="Leave this conversation?"
        description="Leaving the room will disconnect you from your partner. You can rejoin using the same code if the session is still active."
        confirmLabel="Leave Game"
        cancelLabel="Stay in Room"
        destructive
        onConfirm={handleExitRoom}
        onCancel={() => setShowExitDialog(false)}
      />

      <footer className="max-w-xl mx-auto w-full text-center py-4 text-xs text-[var(--ink-tertiary)]">
        Twilight Chronicles • Private Room
      </footer>
    </div>
  );
}
