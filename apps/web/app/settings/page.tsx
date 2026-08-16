"use client";

import Link from "next/link";
import { ArrowLeft, Moon, Sun, Trash2 } from "lucide-react";
import { useThemeStore } from "@/lib/state/themeStore";
import { useGameStore } from "@/lib/state/gameStore";
import { Button } from "@/components/ui/Button";
import { ToastContainer } from "@/components/ui/Toast";

export default function GlobalSettingsPage() {
  const { theme, toggleTheme } = useThemeStore();
  const { toasts, removeToast, addToast, resetGame } = useGameStore();

  const handleClearData = () => {
    resetGame();
    if (typeof localStorage !== "undefined") {
      localStorage.clear();
    }
    addToast("All local cache and session data cleared.", "success");
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--ink-primary)] flex flex-col justify-between p-5 sm:p-8">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      <header className="max-w-xl mx-auto w-full flex items-center justify-between py-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] transition-colors"
        >
          <ArrowLeft size={16} /> Back to Home
        </Link>
        <span className="category-label text-[var(--accent-ember)]">
          Preferences
        </span>
      </header>

      <main className="max-w-md mx-auto w-full my-auto py-6 flex flex-col gap-6">
        <div>
          <h1 className="font-display text-3xl text-[var(--ink-primary)]">
            Settings
          </h1>
          <p className="text-[var(--ink-secondary)] text-sm mt-1">
            Global theme and data controls.
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
                Color Theme
              </p>
              <p className="text-xs text-[var(--ink-tertiary)] capitalize">
                {theme === "dusk" ? "Dusk Theme (Dark)" : "Daylight Theme (Warm Light)"}
              </p>
            </div>
          </div>
          <Button variant="secondary" size="md" onClick={toggleTheme}>
            Toggle
          </Button>
        </div>

        {/* Clear Local Data */}
        <div className="p-4 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trash2 size={20} className="text-[var(--danger)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--ink-primary)]">
                Clear Local Data
              </p>
              <p className="text-xs text-[var(--ink-tertiary)]">
                Removes saved tokens and caches
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="md"
            className="!text-[var(--danger)]"
            onClick={handleClearData}
          >
            Clear
          </Button>
        </div>

        <div className="pt-4 flex flex-col gap-2 text-center text-xs text-[var(--ink-tertiary)]">
          <p>Twilight Chronicles v1.0.0</p>
          <div className="flex justify-center gap-4">
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            <Link href="/terms" className="hover:underline">Terms of Service</Link>
            <Link href="/contact" className="hover:underline">Contact Support</Link>
          </div>
        </div>
      </main>

      <footer className="max-w-xl mx-auto w-full text-center py-4 text-xs text-[var(--ink-tertiary)]">
        Crafted for intimate conversations at dusk.
      </footer>
    </div>
  );
}
