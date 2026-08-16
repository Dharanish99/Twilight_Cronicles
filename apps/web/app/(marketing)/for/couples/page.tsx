import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Heart } from "lucide-react";

export const metadata: Metadata = {
  title: "Twilight Chronicles for Couples",
  description: "Move past logistics and daily routines into meaningful connection.",
};

export default function ForCouplesPage() {
  const highlights = [
    {
      title: "Past the Daily Logistics",
      desc: "Step out of chore discussions and calendar planning into reflections on dreams and memories.",
    },
    {
      title: "Gentle or Deep Pacing",
      desc: "You control the session's intensity ceiling — keep it light and playful, or lean into deep vulnerability.",
    },
    {
      title: "Intimate & Completely Private",
      desc: "No public feeds, no spectators. An encrypted private space designed solely for the two of you.",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-5 py-16 sm:py-24">
      <span className="category-label text-[var(--accent-ember)]">For Couples</span>
      <h1 className="hero-display text-[var(--ink-primary)] mt-3 mb-6">
        Rediscover each other, one question at a time.
      </h1>
      <p className="text-xl text-[var(--ink-secondary)] leading-relaxed mb-12">
        Whether you have been together five months or fifteen years, Twilight Chronicles
        creates the evening pause you didn&apos;t know you needed.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-14">
        {highlights.map((h) => (
          <div
            key={h.title}
            className="p-6 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)]"
          >
            <div className="w-8 h-8 rounded-full bg-[var(--accent-ember-tint)] flex items-center justify-center mb-4 text-[var(--accent-ember)]">
              <Heart size={16} />
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
