import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for Twilight Chronicles.",
};

const SECTIONS = [
  {
    title: "1. Room data and retention",
    body: "The realtime service stores room state in Redis so both players can stay in sync and reconnect. This includes display names, avatars, room settings, the current question, a shared answer until the next turn, an unshared answer draft, and doodles sent in the room. Room data expires after 24 hours without activity. A hosting provider may retain operational logs under its own retention policy.",
  },
  {
    title: "2. Private drafts",
    body: "Your draft is sent to the realtime service as you type so it can be restored after a connection drop. The service does not send the draft to the other player until you choose to share it. Drafts are not end-to-end encrypted, so the service operator and Redis host can process them while the room is active.",
  },
  {
    title: "3. Guest identity",
    body: "The game does not require an account or email address. Your display name and avatar are visible to the other player. A random room-resume token is kept in this browser tab's session storage; anyone who obtains that token may be able to rejoin the same player slot until it expires.",
  },
  {
    title: "4. Reports and highlights",
    body: "Question reports are queued with the question ID, selected reason, room code, and submission time. They do not include your display name or answer. Saved highlights and long-term answer history are not available; answers are not written to the PostgreSQL schema in this version.",
  },
  {
    title: "5. Cookies and advertising",
    body: "The app does not intentionally use advertising or analytics trackers. It uses browser session storage for the guest resume token and local storage for your theme preference. The hosting platform and infrastructure providers may process network and security data to deliver the service.",
  },
  {
    title: "6. Clearing this device",
    body: "The Settings page can clear the guest token and theme preference from this browser. This does not immediately remove an existing room from Redis; room data expires after 24 hours without activity. To ask about a report or privacy concern, contact the service operator using the Contact page.",
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
        Effective date: November 17, 2026
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
