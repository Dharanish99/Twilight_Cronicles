import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about Twilight Chronicles.",
};

const FAQS = [
  {
    q: "Do I need an account?",
    a: "No. You can create and join as a guest with a display name and avatar. The name and avatar are visible to the other player. The app does not currently offer accounts or saved highlights.",
  },
  {
    q: "Is it free?",
    a: "Yes. Twilight Chronicles is free to play. There are no subscriptions, paywalls, or in-app purchases.",
  },
  {
    q: "Can someone else see my answer before I share it?",
    a: "Your draft is sent to the realtime service so it can be restored after a connection drop, but it is not sent to the other player until you choose to share it. Drafts are not end-to-end encrypted.",
  },
  {
    q: "What happens to my answers after the session?",
    a: "Room state, including the current answer draft, is kept in Redis for the game and expires after 24 hours without activity. Answers are not saved to a personal history in this version.",
  },
  {
    q: "Can I play on mobile?",
    a: "Yes. Twilight Chronicles is designed for mobile first. No app download needed — just open the link in your mobile browser.",
  },
  {
    q: "What if my connection drops mid-game?",
    a: "The other player sees a reconnecting notice. When you return in the same browser tab, the game restores the current phase and, for the answerer, the current question and last synced draft.",
  },
  {
    q: "How many questions are there?",
    a: "120 curated questions across 10 categories. The question engine avoids repeats within a room until its category pool is exhausted.",
  },
  {
    q: "Can I skip a question?",
    a: "Yes. There is a \"Not this one\" skip option during your turn. Skipping is frictionless, confidential, and delivers another prompt in the same category.",
  },
  {
    q: "What is the difference between the categories?",
    a: "Categories describe the mood, not the difficulty. \"Playful\" questions are lighthearted and funny. \"Deep\" and \"Emotional\" questions tend to be more reflective. Questions naturally escalate in depth across rounds regardless of category.",
  },
  {
    q: "Can I play more than once with the same person?",
    a: "Yes. Each session is fresh. The question engine avoids repeating questions you have seen before in the same room.",
  },
];

export default function FAQPage() {
  return (
    <div className="max-w-2xl mx-auto px-5 py-16 sm:py-24">
      <span className="category-label text-[var(--accent-ember)]">Questions & Answers</span>
      <h1 className="font-display text-4xl sm:text-5xl text-[var(--ink-primary)] mt-3 mb-12">
        Frequently Asked Questions
      </h1>
      <div className="flex flex-col divide-y divide-[var(--border-subtle)]">
        {FAQS.map(({ q, a }) => (
          <details key={q} className="group py-5">
            <summary className="flex items-center justify-between cursor-pointer list-none gap-4">
              <span className="font-medium text-[var(--ink-primary)] text-base">{q}</span>
              <span
                className="shrink-0 text-[var(--ink-tertiary)] group-open:rotate-45 transition-transform duration-200 text-xl leading-none"
                aria-hidden="true"
              >
                +
              </span>
            </summary>
            <p className="mt-4 text-[var(--ink-secondary)] leading-relaxed text-sm">{a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
