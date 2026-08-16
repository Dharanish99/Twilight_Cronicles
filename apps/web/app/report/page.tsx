"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Flag, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

function ReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const questionId = searchParams.get("questionId") || "";
  const roomId = searchParams.get("roomId") || "";

  const [reason, setReason] = useState<string>("inappropriate");
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--ink-primary)] flex flex-col justify-between p-5 sm:p-8">
      <header className="max-w-xl mx-auto w-full flex items-center justify-between py-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] transition-colors"
        >
          <ArrowLeft size={16} /> Return
        </button>
        <span className="category-label text-[var(--danger)]">Safety</span>
      </header>

      <main className="max-w-md mx-auto w-full my-auto py-8">
        {submitted ? (
          <div className="flex flex-col items-center gap-4 text-center p-6 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <CheckCircle size={40} className="text-[var(--success)]" />
            <h1 className="font-display text-2xl text-[var(--ink-primary)]">
              Thank You for Reporting
            </h1>
            <p className="text-sm text-[var(--ink-secondary)] leading-relaxed">
              Our content moderation team will review this question prompt promptly.
            </p>
            <Button variant="primary" size="md" onClick={() => router.back()} className="mt-2">
              Back to Game
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--danger-tint)] flex items-center justify-center text-[var(--danger)]">
                <Flag size={20} />
              </div>
              <div>
                <h1 className="font-display text-2xl text-[var(--ink-primary)]">
                  Report Question
                </h1>
                <p className="text-xs text-[var(--ink-tertiary)]">
                  {questionId ? `Question ID: ${questionId}` : "Safety & Guidelines"}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-[var(--ink-primary)]">
                Reason for report
              </label>
              <div className="flex flex-col gap-2">
                {[
                  { id: "inappropriate", label: "Inappropriate or offensive phrasing" },
                  { id: "harmful", label: "Sensitive / potentially triggering content" },
                  { id: "typo", label: "Typo or formatting error" },
                  { id: "other", label: "Other concern" },
                ].map((r) => (
                  <label
                    key={r.id}
                    className="flex items-center gap-3 p-3 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] cursor-pointer hover:border-[var(--ink-tertiary)]"
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={r.id}
                      checked={reason === r.id}
                      onChange={(e) => setReason(e.target.value)}
                      className="accent-[var(--accent-ember)]"
                    />
                    <span className="text-sm text-[var(--ink-primary)]">{r.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="report-details" className="text-sm font-semibold text-[var(--ink-primary)]">
                Additional Details (Optional)
              </label>
              <textarea
                id="report-details"
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Help us understand the issue..."
                className="w-full p-3 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-[var(--accent-ember)] outline-none text-sm text-[var(--ink-primary)] resize-none"
              />
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" type="button" onClick={() => router.back()} className="flex-1">
                Cancel
              </Button>
              <Button variant="primary" type="submit" className="flex-1 !bg-[var(--danger)] hover:!bg-[var(--danger)]/90">
                Submit Report
              </Button>
            </div>
          </form>
        )}
      </main>

      <footer className="max-w-xl mx-auto w-full text-center py-4 text-xs text-[var(--ink-tertiary)]">
        Reports are confidential.
      </footer>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">Loading...</div>}>
      <ReportContent />
    </Suspense>
  );
}
