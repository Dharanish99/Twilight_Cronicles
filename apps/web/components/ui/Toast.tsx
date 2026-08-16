"use client";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, Info, X } from "lucide-react";
import { useReducedMotion } from "@/lib/a11y/useReducedMotion";
import { toastEnter } from "@/lib/theme/motion";

export type ToastVariant = "success" | "neutral";

export interface ToastProps {
  id: string;
  message: string;
  variant?: ToastVariant;
  onDismiss?: (id: string) => void;
}

export function Toast({ id, message, variant = "neutral", onDismiss }: ToastProps) {
  const reduced = useReducedMotion();
  const anim = toastEnter(reduced);

  return (
    <motion.div
      key={id}
      {...anim}
      role="alert"
      aria-live="polite"
      className="flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] shadow-[var(--shadow-md)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] min-w-[280px] max-w-[360px]"
    >
      {variant === "success" ? (
        <CheckCircle size={18} className="text-[var(--success)] shrink-0" aria-hidden="true" />
      ) : (
        <Info size={18} className="text-[var(--ink-secondary)] shrink-0" aria-hidden="true" />
      )}
      <span className="text-[var(--ink-primary)] text-sm flex-1">{message}</span>
      {onDismiss && (
        <button
          onClick={() => onDismiss(id)}
          className="p-1 rounded hover:bg-[var(--bg-sunken)] transition-colors text-[var(--ink-tertiary)] hover:text-[var(--ink-primary)] min-w-[32px] min-h-[32px] flex items-center justify-center"
          aria-label="Dismiss notification"
        >
          <X size={14} aria-hidden="true" />
        </button>
      )}
    </motion.div>
  );
}

// Toast container — fixed position, bottom on mobile / top-right on desktop
export function ToastContainer({ toasts, onDismiss }: { toasts: ToastProps[]; onDismiss: (id: string) => void }) {
  return (
    <div
      aria-label="Notifications"
      className="fixed z-50 flex flex-col gap-2
        bottom-4 left-4 right-4
        sm:bottom-auto sm:top-4 sm:left-auto sm:right-4 sm:w-auto"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <Toast key={t.id} {...t} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}
