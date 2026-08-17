import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { JoinForm } from "./JoinForm";

export const metadata: Metadata = {
  title: "Join a Game — Twilight Chronicles",
  description:
    "Enter your room code or open your invite link to join a private Twilight Chronicles session.",
  openGraph: {
    title: "Join a Game — Twilight Chronicles",
    description:
      "Enter your room code or open your invite link to join a private Twilight Chronicles session.",
  },
};

export default function JoinPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--ink-primary)] flex flex-col justify-between p-5 sm:p-8">
      <header className="max-w-2xl mx-auto w-full flex items-center justify-between py-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] transition-colors"
        >
          <ArrowLeft size={16} /> Back to Home
        </Link>
      </header>

      <main className="max-w-md mx-auto w-full my-auto py-8">
        <div className="flex flex-col gap-8">
          {/* Server-rendered heading — visible immediately, no JS needed */}
          <div>
            <span className="category-label text-[var(--accent-ember)]">Join Session</span>
            <h1 className="font-display text-3xl sm:text-4xl text-[var(--ink-primary)] mt-2">
              Enter the Room
            </h1>
            <p className="text-[var(--ink-secondary)] text-sm mt-1">
              Enter your room code and choose your name to join your partner.
            </p>
          </div>

          {/* Client island — handles searchParams, form state, and submission */}
          <JoinForm />
        </div>
      </main>

      <footer className="max-w-2xl mx-auto w-full text-center py-4 text-xs text-[var(--ink-tertiary)]">
        No account required. All connections are end-to-end synchronized.
      </footer>
    </div>
  );
}
