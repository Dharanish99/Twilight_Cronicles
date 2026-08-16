import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Users, Shuffle, Lock } from "lucide-react";

export const metadata: Metadata = {
  title: "Twilight Chronicles — The conversations that come out at dusk",
  description:
    "A two-player conversation game for people who aren't in the same room — you choose the mood, Twilight Chronicles chooses the question.",
};

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* ─── Hero ─────────────────────────────────────────── */}
      <section className="min-h-[90vh] flex flex-col items-center justify-center px-5 py-20 text-center relative overflow-hidden bg-surface-base">
        {/* Ambient glow */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 40%, var(--accent-ember-tint) 0%, transparent 70%)",
            opacity: 0.6,
          }}
        />
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-8 relative z-10">
          <span className="category-label text-[var(--accent-ember)] font-semibold tracking-wider">
            Two players &mdash; one thread
          </span>
          <h1 className="hero-display text-ink-primary font-serif">
            The conversations that
            <br />
            <span className="text-[var(--accent-ember)]">come out at dusk.</span>
          </h1>
          <p className="text-xl text-ink-secondary max-w-lg leading-relaxed font-normal">
            A two-player conversation game for people who aren&rsquo;t in the same
            room &mdash; you choose the mood, Twilight Chronicles chooses the
            question.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-3">
            <Link
              href="/create"
              id="hero-start-cta"
              className="flex items-center justify-center gap-2 px-8 py-4 bg-[var(--accent-ember)] text-white rounded-[var(--radius-sm)] font-semibold text-base hover:bg-[var(--accent-ember-hover)] shadow-md hover:shadow-lg transition-all min-h-[52px] sm:min-w-[180px]"
            >
              Start a Game <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link
              href="/join"
              id="hero-join-cta"
              className="flex items-center justify-center gap-2 px-8 py-4 bg-surface-elevated text-ink-primary rounded-[var(--radius-sm)] font-semibold text-base border-2 border-theme-subtle hover:border-[var(--accent-ember)] shadow-sm hover:shadow-md transition-all min-h-[52px] sm:min-w-[180px]"
            >
              Join a Game
            </Link>
          </div>
          <p className="text-sm text-ink-tertiary font-medium">
            No account required. Free to play.
          </p>
        </div>
      </section>

      {/* ─── How it works ─────────────────────────────────── */}
      <section className="bg-surface-sunken py-20 px-5 border-y border-theme-subtle">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-3xl sm:text-4xl text-ink-primary text-center mb-3 font-serif">
            How it works
          </h2>
          <p className="text-center text-ink-secondary mb-14 max-w-lg mx-auto text-base">
            Two people. One thread, chronicled turn by turn.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {(
              [
                {
                  Icon: Users,
                  title: "Create a room",
                  desc: "One person starts a game and shares a link. The other joins in seconds — no account needed.",
                },
                {
                  Icon: Shuffle,
                  title: "Choose a mood",
                  desc: "Each turn, the active player picks a category. Twilight Chronicles picks the exact question — always a surprise.",
                },
                {
                  Icon: Lock,
                  title: "Answer privately, share when ready",
                  desc: "Type your answer privately. Lock it in, then share it when you're ready. The other player never sees it early.",
                },
              ] as const
            ).map(({ Icon, title, desc }) => (
              <div
                key={title}
                className="flex flex-col gap-4 p-6 rounded-[var(--radius-lg)] bg-surface-elevated border border-theme-subtle shadow-sm"
              >
                <div className="w-12 h-12 rounded-[var(--radius-md)] bg-[var(--accent-ember-tint)] flex items-center justify-center shrink-0">
                  <Icon
                    size={22}
                    className="text-[var(--accent-ember)]"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="font-semibold text-lg text-ink-primary">
                  {title}
                </h3>
                <p className="text-ink-secondary text-sm leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link
              href="/how-it-works"
              className="text-[var(--accent-ember)] hover:text-[var(--accent-ember-hover)] text-sm font-semibold underline underline-offset-4 transition-colors"
            >
              Learn more about how it works &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Category showcase ────────────────────────────── */}
      <section className="py-20 px-5 bg-surface-base">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-3xl sm:text-4xl text-ink-primary text-center mb-3 font-serif">
            Ten moods to explore
          </h2>
          <p className="text-center text-ink-secondary mb-12 max-w-lg mx-auto text-base">
            Questions that start playful and gradually open up — the game sets
            the pace, not you.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Deep", color: "var(--cat-deep)", emoji: "🌊" },
              { label: "Playful", color: "var(--cat-playful)", emoji: "✨" },
              { label: "Emotional", color: "var(--cat-emotional)", emoji: "🌸" },
              { label: "Curious", color: "var(--cat-curious)", emoji: "🔍" },
              { label: "Memories", color: "var(--cat-memories)", emoji: "📷" },
              { label: "Future", color: "var(--cat-future)", emoji: "🌅" },
              { label: "Chaotic", color: "var(--cat-chaotic)", emoji: "🎲" },
              {
                label: "Would You Rather",
                color: "var(--cat-would-you-rather)",
                emoji: "⚖️",
              },
              {
                label: "Friendship",
                color: "var(--cat-friendship)",
                emoji: "🤝",
              },
              {
                label: "Getting to Know You",
                color: "var(--cat-getting-to-know-you)",
                emoji: "👋",
              },
            ].map(({ label, color, emoji }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-2 p-4 rounded-[var(--radius-md)] bg-surface-elevated border border-theme-subtle text-center hover:shadow-md transition-shadow"
              >
                <span className="text-2xl" aria-hidden="true">
                  {emoji}
                </span>
                <span
                  className="category-label text-center leading-tight font-semibold"
                  style={{ color }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── For section ──────────────────────────────────── */}
      <section className="py-20 px-5 bg-surface-sunken border-t border-theme-subtle">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl sm:text-4xl text-ink-primary mb-4 font-serif">
            Made for the people you actually want to talk to
          </h2>
          <p className="text-ink-secondary text-lg mb-10 leading-relaxed max-w-xl mx-auto">
            Not a speed-dating app. Not a trivia night. Just two people, some
            thoughtful questions, and the kind of conversation that usually only
            happens at 2am.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {[
              { href: "/for/best-friends", label: "Best friends" },
              { href: "/for/couples", label: "Couples" },
              { href: "/for/long-distance", label: "Long distance" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="px-6 py-3.5 rounded-[var(--radius-sm)] bg-surface-elevated border-2 border-theme-subtle text-ink-primary hover:border-[var(--accent-ember)] transition-all text-sm font-semibold min-h-[44px] flex items-center justify-center shadow-sm"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ────────────────────────────────────── */}
      <section className="py-24 px-5 bg-surface-base text-center">
        <div className="max-w-2xl mx-auto flex flex-col items-center gap-6">
          <h2 className="font-display text-3xl sm:text-4xl text-ink-primary font-serif">
            Ready to start a thread?
          </h2>
          <p className="text-ink-secondary text-lg max-w-md">
            No account. No setup. Just two people and some questions worth
            asking.
          </p>
          <Link
            href="/create"
            id="footer-start-cta"
            className="flex items-center gap-2 px-8 py-4 bg-[var(--accent-ember)] text-white rounded-[var(--radius-sm)] font-semibold text-lg hover:bg-[var(--accent-ember-hover)] shadow-md hover:shadow-lg transition-all min-h-[56px]"
          >
            Start a Game <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
