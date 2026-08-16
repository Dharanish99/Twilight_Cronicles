import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Twilight Chronicles for Best Friends",
  description: "Questions that go deeper than your usual banter with the people who know you best.",
};

export default function ForBestFriendsPage() {
  const highlights = [
    {
      title: "Unlock the Friendship Deck",
      desc: "Prompts tailored specifically for friends who have shared years of history and inside jokes.",
    },
    {
      title: "Surface the Unsaid",
      desc: "Some gratitude and honest reflections are easier to share when the game asks first.",
    },
    {
      title: "Zero Awkwardness",
      desc: "Equal turns, balanced intensities, and private drafts until you both choose to reveal.",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-5 py-16 sm:py-24">
      <span className="category-label text-[var(--accent-ember)]">For Best Friends</span>
      <h1 className="hero-display text-[var(--ink-primary)] mt-3 mb-6">
        The conversations you never get around to having.
      </h1>
      <p className="text-xl text-[var(--ink-secondary)] leading-relaxed mb-12">
        You already talk every day about the small things. Twilight Chronicles gives you
        an hour to talk about the things that actually matter.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-14">
        {highlights.map((h) => (
          <div
            key={h.title}
            className="p-6 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)]"
          >
            <div className="w-8 h-8 rounded-full bg-[var(--accent-ember-tint)] flex items-center justify-center mb-4 text-[var(--accent-ember)]">
              <Check size={16} />
            </div>
            <h2 className="font-semibold text-[var(--ink-primary)] mb-2">{h.title}</h2>
            <p className="text-sm text-[var(--ink-secondary)] leading-relaxed">{h.desc}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-4 flex-wrap">
        <Link
          href="/create"
          className="flex items-center gap-2 px-6 py-3.5 bg-[var(--accent-ember)] text-white rounded-[var(--radius-sm)] font-semibold hover:bg-[var(--accent-ember-hover)] transition-colors min-h-[48px]"
        >
          Start a Game <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
