import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for Twilight Chronicles.",
};

const SECTIONS = [
  {
    title: "1. Ephemeral by Default",
    body: "We believe private conversations should stay private. Your draft answers are held ephemerally in Redis memory solely for the active session, with a hard time-to-live (TTL) of 24 hours. They are never committed to permanent databases or logs.",
  },
  {
    title: "2. Server-Side Answer Privacy",
    body: "While you are typing your answer, zero keystrokes or text fragments are streamed to the other participant. The server does not transmit the answer payload until you explicitly tap 'Share with [Player]'.",
  },
  {
    title: "3. Encrypted Highlights (Opt-in)",
    body: "If both players mutually choose to bookmark an answer as a Highlight, the content is encrypted at rest using AES-256-GCM before being stored in the database. Keys are managed server-side and never exposed to the client bundle.",
  },
  {
    title: "4. No Third-Party Tracking or Ads",
    body: "Twilight Chronicles contains no advertising networks, no data brokers, and no tracking pixels. We only collect anonymous aggregated metrics (such as round completion rates and general question skip counts) to balance our question deck.",
  },
  {
    title: "5. Guest Accounts & Session Tokens",
    body: "When playing as a guest, we store no personally identifiable information (PII). Authentication uses secure, HttpOnly session tokens that automatically expire when the session concludes.",
  },
  {
    title: "6. Data Deletion",
    body: "You can delete all your stored highlights or account history at any time through the Settings page. Deletion is instantaneous and permanent.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-5 py-16 sm:py-24">
      <span className="category-label text-[var(--accent-ember)]">Trust & Security</span>
      <h1 className="font-display text-4xl sm:text-5xl text-[var(--ink-primary)] mt-3 mb-3">
        Privacy Policy
      </h1>
      <p className="text-[var(--ink-tertiary)] text-sm mb-10">
        Effective date: January 1, 2026
      </p>

      <div className="flex flex-col gap-8 text-[var(--ink-secondary)] leading-relaxed">
        {SECTIONS.map(({ title, body }) => (
          <div key={title} className="flex flex-col gap-2">
            <h2 className="font-semibold text-lg text-[var(--ink-primary)]">{title}</h2>
            <p>{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
