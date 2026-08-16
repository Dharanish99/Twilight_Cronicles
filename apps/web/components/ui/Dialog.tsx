"use client";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/a11y/useReducedMotion";
import { backdropEnter } from "@/lib/theme/motion";
import { Button } from "./Button";

export interface DialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  children?: React.ReactNode;
  destructive?: boolean;
}

export function Dialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  children,
  destructive = false,
}: DialogProps) {
  const reduced = useReducedMotion();
  const backdropAnim = backdropEnter(reduced);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus trap
  useEffect(() => {
    if (open) {
      dialogRef.current?.focus();
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel?.();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            {...backdropAnim}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onCancel}
            aria-hidden="true"
          />
          {/* Dialog */}
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            aria-describedby={description ? "dialog-desc" : undefined}
            tabIndex={-1}
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: reduced ? 0.1 : 0.2 }}
            className="fixed z-50 inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2
              w-full sm:w-[480px] sm:max-w-[90vw]
              bg-[var(--bg-elevated)] rounded-t-[var(--radius-lg)] sm:rounded-[var(--radius-lg)]
              shadow-[var(--shadow-lg)] p-6 sm:p-8"
          >
            <div className="flex items-start justify-between mb-4">
              <h2 id="dialog-title" className="text-lg font-semibold text-[var(--ink-primary)]">
                {title}
              </h2>
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="p-1.5 rounded hover:bg-[var(--bg-sunken)] text-[var(--ink-tertiary)] hover:text-[var(--ink-primary)] transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                  aria-label="Close dialog"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              )}
            </div>
            {description && (
              <p id="dialog-desc" className="text-[var(--ink-secondary)] text-sm mb-6 leading-relaxed">
                {description}
              </p>
            )}
            {children}
            {(onConfirm || onCancel) && (
              <div className="flex gap-3 mt-6 justify-end">
                {onCancel && (
                  <Button variant="secondary" onClick={onCancel}>
                    {cancelLabel}
                  </Button>
                )}
                {onConfirm && (
                  <Button
                    variant="primary"
                    onClick={onConfirm}
                    className={destructive ? "!bg-[var(--danger)] hover:!bg-[var(--danger)]" : ""}
                  >
                    {confirmLabel}
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
