import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "Learn how Twilight Chronicles works — create a room, choose a mood, and let the questions do the rest.",
};

const STEPS = [
  {
    step: "01",
    title: "Create a room",
    body: "One person creates a game, customises the session length and mood settings, then gets a shareable link and room code. No account required.",
  },
  {
    step: "02",
    title: "Your person joins",
    body: "Send them the link. They click it, enter a display name, and they're in. Both of you see each other in the lobby. When both tap Ready, the game starts.",
  },
  {
    step: "03",
    title: "Choose a mood",
    body: "The active player picks a category — Deep, Playful, Emotional, Curious, and more. You choose the feeling; Twilight Chronicles picks the exact question. It's always a surprise, even to you.",
  },
  {
    step: "04",
    title: "Answer privately",
    body: "You read the question alone. Type your answer privately. The other player never sees the question or your draft — they only know you're answering. When you're ready, lock it in.",
  },
  {
    step: "05",
    title: "Share when ready",
    body: "Locked answers stay private until you tap \"Share with [name]\". Then both players see the question and your answer at the same time.",
  },
  {
    step: "06",
    title: "Turn passes",
    body: "After the reveal, the turn passes to the other player. Questions gradually get more meaningful across rounds — the game sets the pace for you.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="max-w-3xl mx-auto px-5 py-16 sm:py-24">
      <div className="mb-12">
        <span className="category-label text-[var(--accent-ember)] font-semibold">The basics</span>
        <h1 className="font-display text-4xl sm:text-5xl text-ink-primary mt-3 mb-4 font-serif">
          How it works
        </h1>
        <p className="text-xl text-ink-secondary leading-relaxed">
          Twilight Chronicles is a two-player turn-based conversation game. No timers to
          stress you out, no points to chase, no leaderboards. Just questions worth
          answering.
        </p>
      </div>

      <div className="flex flex-col gap-10">
        {STEPS.map(({ step, title, body }) => (
          <div key={step} className="flex gap-6 sm:gap-8 p-6 rounded-[var(--radius-lg)] bg-surface-elevated border border-theme-subtle shadow-sm">
            <div className="shrink-0">
              <span className="font-display text-4xl text-[var(--accent-ember)] font-bold leading-none">
                {step}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-ink-primary mb-2 font-serif">
                {title}
              </h2>
              <p className="text-ink-secondary text-base leading-relaxed">{body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 p-8 rounded-[var(--radius-lg)] bg-surface-sunken border border-theme-subtle shadow-sm">
        <h2 className="font-semibold text-lg text-ink-primary mb-2 font-serif">
          The privacy guarantee
        </h2>
        <p className="text-ink-secondary text-base leading-relaxed">
          Your draft answers are never sent to the other player&apos;s device — ever. Not
          even a keystroke. The server holds your answer privately until you explicitly
          tap Share. After the session ends, all answer content is discarded
          automatically within 24 hours.
        </p>
      </div>

      <div className="mt-12 flex gap-4 flex-wrap">
        <Link
          href="/create"
          className="px-6 py-3.5 bg-[var(--accent-ember)] text-white rounded-[var(--radius-sm)] font-semibold hover:bg-[var(--accent-ember-hover)] shadow-md transition-colors min-h-[44px] flex items-center"
        >
          Start a Game
        </Link>
        <Link
          href="/faq"
          className="px-6 py-3.5 bg-surface-elevated text-ink-primary border-2 border-theme-subtle rounded-[var(--radius-sm)] font-semibold hover:border-[var(--accent-ember)] transition-colors min-h-[44px] flex items-center"
        >
          FAQ
        </Link>
      </div>
    </div>
  );
}
