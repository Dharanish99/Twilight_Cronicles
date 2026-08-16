"use client";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/a11y/useReducedMotion";
import { bottomSheetEnter, backdropEnter } from "@/lib/theme/motion";

export interface BottomSheetProps {
  open: boolean;
  title?: string;
  onClose?: () => void;
  children: React.ReactNode;
}

export function BottomSheet({ open, title, onClose, children }: BottomSheetProps) {
  const reduced = useReducedMotion();
  const sheetAnim = bottomSheetEnter(reduced);
  const backdropAnim = backdropEnter(reduced);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      sheetRef.current?.focus();
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            {...backdropAnim}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "sheet-title" : undefined}
            tabIndex={-1}
            {...sheetAnim}
            className="fixed z-50 bottom-0 left-0 right-0
              sm:left-auto sm:right-4 sm:bottom-4 sm:w-[480px] sm:max-h-[85vh]
              bg-[var(--bg-elevated)] rounded-t-[var(--radius-lg)] sm:rounded-[var(--radius-lg)]
              shadow-[var(--shadow-lg)] flex flex-col max-h-[85vh]"
          >
            {/* Handle */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--border-subtle)] shrink-0">
              <div className="sm:hidden w-10 h-1 bg-[var(--border-subtle)] rounded-full mx-auto absolute top-2.5 left-1/2 -translate-x-1/2" />
              {title && (
                <h2 id="sheet-title" className="font-semibold text-[var(--ink-primary)] text-base pt-2 sm:pt-0">
                  {title}
                </h2>
              )}
              {onClose && (
                <button
                  onClick={onClose}
                  className="ml-auto p-1.5 rounded hover:bg-[var(--bg-sunken)] text-[var(--ink-tertiary)] hover:text-[var(--ink-primary)] transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                  aria-label="Close"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              )}
            </div>
            <div className="overflow-y-auto flex-1 p-4 sm:p-5">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
