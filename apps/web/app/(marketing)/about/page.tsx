import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description: "About Twilight Chronicles — why we built it and what it's for.",
};

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-5 py-16 sm:py-24">
      <span className="category-label text-[var(--accent-ember)]">The story</span>
      <h1 className="font-display text-4xl sm:text-5xl text-[var(--ink-primary)] mt-3 mb-8">
        About
      </h1>

      <div className="prose prose-lg text-[var(--ink-secondary)] leading-relaxed flex flex-col gap-6">
        <p>
          Twilight Chronicles started with a simple observation: some of the most honest
          conversations happen when you don&apos;t have to initiate them. When someone else
          opens the door.
        </p>
        <p>
          We built this for two people who know each other, or want to — but aren&apos;t in
          the same room. Long-distance couples. Old friends in different cities. Two people
          at the start of something.
        </p>
        <p>
          The product is deliberately minimal. No points. No streaks. No gamification. Just
          a mood, a question, and two people willing to answer it honestly.
        </p>
        <p>
          The name comes from the hour when people tend to open up. When the day is
          technically over but the night hasn&apos;t quite started. When there&apos;s
          nothing left to be productive about, so you end up talking instead.
        </p>
        <p>We hope it gives you a few of those conversations.</p>
      </div>

      <div className="mt-16 flex gap-4 flex-wrap">
        <Link
          href="/create"
          className="px-5 py-3 bg-[var(--accent-ember)] text-white rounded-[var(--radius-sm)] font-semibold hover:bg-[var(--accent-ember-hover)] transition-colors min-h-[44px] flex items-center"
        >
          Start a Game
        </Link>
        <Link
          href="/contact"
          className="px-5 py-3 text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] underline underline-offset-2 transition-colors min-h-[44px] flex items-center text-sm"
        >
          Get in touch
        </Link>
      </div>
    </div>
  );
}
