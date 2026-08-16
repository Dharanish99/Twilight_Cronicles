import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about Twilight Chronicles.",
};

const FAQS = [
  {
    q: "Do I need an account?",
    a: "No. You can create and join games as a guest with just a display name. Accounts are optional and only needed if you want to save highlights or session history across devices.",
  },
  {
    q: "Is it free?",
    a: "Yes. Twilight Chronicles is free to play. There are no subscriptions, paywalls, or in-app purchases.",
  },
  {
    q: "Can someone else see my answer before I share it?",
    a: "No. Your draft answer never leaves your device until you tap \"Lock it in\", and it never reaches the other player until you explicitly tap \"Share\". This is enforced at the server level — it is not a client-side trick.",
  },
  {
    q: "What happens to my answers after the session?",
    a: "All session content (questions, answers, drafts) is held ephemerally and automatically discarded within 24 hours of the session ending. Nothing is stored in a database unless you explicitly choose to save a Highlight.",
  },
  {
    q: "Can I play on mobile?",
    a: "Yes. Twilight Chronicles is designed for mobile first. No app download needed — just open the link in your mobile browser.",
  },
  {
    q: "What if my connection drops mid-game?",
    a: "The game handles disconnects gracefully. If you lose connection, the other player sees a subtle reconnection notice. When you reconnect, the game resumes exactly where you left off — same question, same draft state.",
  },
  {
    q: "How many questions are there?",
    a: "Over 120 curated questions across 10 categories, with more added regularly. The question engine ensures you do not see repeats within a session.",
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
