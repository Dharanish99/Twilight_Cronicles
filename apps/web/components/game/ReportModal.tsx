"use client";

import { useState, useEffect, useRef } from "react";
import { Flag, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useGameStore } from "@/lib/state/gameStore";
import { getSocket } from "@/lib/socket/client";

const REPORT_REASONS = [
  { id: "offensive", label: "Offensive or harmful" },
  { id: "too_personal", label: "Too personal / invasive" },
  { id: "repetitive", label: "I've seen this question before" },
  { id: "poorly_written", label: "Poorly worded" },
  { id: "wrong_category", label: "Doesn't fit this category" },
  { id: "other", label: "Other" },
] as const;

type ReportReason = (typeof REPORT_REASONS)[number]["id"];

interface ReportModalProps {
  isOpen: boolean;
  questionId: string;
  onClose: () => void;
}

export function ReportModal({ isOpen, questionId, onClose }: ReportModalProps) {
  const { addToast } = useGameStore();
  const [selected, setSelected] = useState<ReportReason | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Reset state when re-opened
  useEffect(() => {
    if (isOpen) {
      setSelected(null);
      setSubmitted(false);
    }
  }, [isOpen, questionId]);

  // Close on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!selected) return;
    try {
      getSocket().emit("question:report", { questionId, reason: selected });
    } catch {
      // Non-fatal — server logs the report independently
    }
    setSubmitted(true);
    setTimeout(() => {
      addToast("Thanks — the question has been flagged for review.", "success");
      onClose();
    }, 1200);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
        onClick={(e) => e.target === overlayRef.current && onClose()}
        role="dialog"
        aria-modal="true"
        aria-label="Report this question"
      >
        {/* Modal Panel */}
        <div className="w-full max-w-sm bg-[var(--bg-elevated)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] shadow-[var(--shadow-lg)] flex flex-col gap-5 p-6 animate-[slideUp_0.2s_ease]">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[var(--bg-sunken)] flex items-center justify-center">
                <Flag size={14} className="text-[var(--ink-secondary)]" />
              </div>
              <div>
                <h2 className="font-semibold text-[var(--ink-primary)] text-sm">Flag Question</h2>
                <p className="text-[11px] text-[var(--ink-tertiary)]">Your report is anonymous</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--ink-tertiary)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-sunken)] transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          {submitted ? (
            <div className="py-6 text-center flex flex-col gap-2">
              <span className="text-2xl">✓</span>
              <p className="text-sm text-[var(--ink-secondary)]">Flagged. Thank you.</p>
            </div>
          ) : (
            <>
              {/* Reason List */}
              <div className="flex flex-col gap-2">
                {REPORT_REASONS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelected(r.id)}
                    className={`text-left px-3 py-2.5 rounded-[var(--radius-sm)] border text-sm transition-all ${
                      selected === r.id
                        ? "border-[var(--accent-ember)] bg-[var(--accent-ember-tint)] text-[var(--ink-primary)] font-medium"
                        : "border-[var(--border-subtle)] bg-[var(--bg-base)] text-[var(--ink-secondary)] hover:border-[var(--ink-tertiary)]"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <Button
                variant="secondary"
                size="md"
                disabled={!selected}
                onClick={handleSubmit}
                id="report-modal-submit-btn"
                className="w-full"
              >
                Submit Report
              </Button>
            </>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
