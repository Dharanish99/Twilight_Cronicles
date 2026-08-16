import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the Twilight Chronicles team.",
};

export default function ContactPage() {
  return (
    <div className="max-w-xl mx-auto px-5 py-16 sm:py-24">
      <span className="category-label text-[var(--accent-ember)]">Say hello</span>
      <h1 className="font-display text-4xl sm:text-5xl text-[var(--ink-primary)] mt-3 mb-4">
        Contact
      </h1>
      <p className="text-[var(--ink-secondary)] mb-10 leading-relaxed">
        Have a question, a suggestion for a prompt, or want to share how a session went?
        We read every message.
      </p>

      <div className="flex flex-col gap-4">
        <a
          href="mailto:hello@twilightchronicles.app"
          className="px-5 py-4 bg-[var(--accent-ember)] text-white rounded-[var(--radius-sm)] font-semibold hover:bg-[var(--accent-ember-hover)] transition-colors min-h-[48px] flex items-center justify-center text-center"
        >
          hello@twilightchronicles.app
        </a>
        <a
          href="mailto:safety@twilightchronicles.app"
          className="px-5 py-4 bg-[var(--bg-sunken)] text-[var(--ink-primary)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] hover:border-[var(--accent-ember)] transition-colors min-h-[48px] flex items-center justify-center text-center text-sm"
        >
          Safety &amp; Content Reports: safety@twilightchronicles.app
        </a>
      </div>
    </div>
  );
}
