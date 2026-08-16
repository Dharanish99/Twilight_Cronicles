import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Globe } from "lucide-react";

export const metadata: Metadata = {
  title: "Twilight Chronicles for Long Distance",
  description: "Feel in the same room even when you are time zones apart.",
};

export default function ForLongDistancePage() {
  const highlights = [
    {
      title: "Real-time Synchronization",
      desc: "Live typing states, instant reveal moments, and shared emoji reactions bridge the physical distance.",
    },
    {
      title: "Asynchronous Resilience",
      desc: "If either player experiences a drop in wifi, session reconnection is seamless with zero lost drafts.",
    },
    {
      title: "More Engaging Than Video Fatigue",
      desc: "Structured, focused prompts give you something real to share instead of 'So, how was your day?'",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-5 py-16 sm:py-24">
      <span className="category-label text-[var(--accent-ember)]">For Long Distance</span>
      <h1 className="hero-display text-[var(--ink-primary)] mt-3 mb-6">
        Across the miles, under the same twilight.
      </h1>
      <p className="text-xl text-[var(--ink-secondary)] leading-relaxed mb-12">
        Designed from the ground up for two screens in two different places.
        Keep the spark alive and conversations deep no matter the distance.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-14">
        {highlights.map((h) => (
          <div
            key={h.title}
            className="p-6 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)]"
          >
            <div className="w-8 h-8 rounded-full bg-[var(--accent-ember-tint)] flex items-center justify-center mb-4 text-[var(--accent-ember)]">
              <Globe size={16} />
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
