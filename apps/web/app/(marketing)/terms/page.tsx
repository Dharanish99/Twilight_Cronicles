import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of service for Twilight Chronicles.",
};

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-5 py-16 sm:py-24">
      <span className="category-label text-[var(--accent-ember)]">Legal</span>
      <h1 className="font-display text-4xl sm:text-5xl text-[var(--ink-primary)] mt-3 mb-3">
        Terms of Service
      </h1>
      <p className="text-[var(--ink-tertiary)] text-sm mb-10">Last updated: 2026</p>

      <div className="flex flex-col gap-8 text-[var(--ink-secondary)] leading-relaxed">
        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-lg text-[var(--ink-primary)]">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing or playing Twilight Chronicles, you agree to comply with and be bound
            by these Terms of Service. If you disagree with any portion of these terms,
            please do not use the application.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-lg text-[var(--ink-primary)]">
            2. Responsible Use & Conduct
          </h2>
          <p>
            Twilight Chronicles is intended for thoughtful, consensual interpersonal
            conversations. You agree not to use the service to transmit defamatory, abusive,
            harassing, or illegal material.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-lg text-[var(--ink-primary)]">
            3. Content Moderation & Reporting
          </h2>
          <p>
            We provide reporting tools within every game session. If you encounter questions
            that violate community safety standards, you may flag them for immediate review
            by our safety team.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-lg text-[var(--ink-primary)]">
            4. Service Availability
          </h2>
          <p>
            Twilight Chronicles is provided on an &quot;as is&quot; and &quot;as available&quot; basis
            without warranties of uninterrupted uptime.
          </p>
        </section>
      </div>
    </div>
  );
}
