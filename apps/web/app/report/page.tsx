"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Flag } from "lucide-react";
import { Button } from "@/components/ui/Button";

function ReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const questionId = searchParams.get("questionId");

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--ink-primary)] flex flex-col justify-between p-5 sm:p-8">
      <header className="max-w-xl mx-auto w-full py-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] transition-colors"
        >
          <ArrowLeft size={16} /> Return
        </button>
      </header>

      <main className="max-w-md mx-auto w-full my-auto py-8">
        <div className="flex flex-col items-center gap-4 text-center p-6 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
          <Flag size={32} className="text-[var(--danger)]" />
          <h1 className="font-display text-2xl text-[var(--ink-primary)]">Report a question</h1>
          <p className="text-sm text-[var(--ink-secondary)] leading-relaxed">
            Send a report from the flag button beside a question during your game. That submits the question ID and reason to the game service. This page does not accept reports.
          </p>
          {questionId && <p className="text-xs text-[var(--ink-tertiary)]">Question ID: {questionId}</p>}
          <Button variant="primary" size="md" onClick={() => router.back()} className="mt-2">
            Back to Game
          </Button>
        </div>
      </main>

      <footer className="max-w-xl mx-auto w-full text-center py-4 text-xs text-[var(--ink-tertiary)]">
        Reports are stored for content review; this release has no review timeline.
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
