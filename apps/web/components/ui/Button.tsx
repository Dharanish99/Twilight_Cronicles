"use client";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/lib/a11y/useReducedMotion";

export type ButtonVariant = "primary" | "secondary" | "text";
export type ButtonSize = "md" | "lg";

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  children: React.ReactNode;
  className?: string;
  id?: string;
}

const BASE =
  "inline-flex items-center justify-center font-semibold rounded-[var(--radius-sm)] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ember)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--accent-ember)] text-white hover:bg-[var(--accent-ember-hover)] active:bg-[var(--accent-ember-hover)]",
  secondary:
    "bg-[var(--bg-sunken)] text-[var(--ink-primary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] active:bg-[var(--bg-sunken)]",
  text: "bg-transparent text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] underline-offset-2 hover:underline",
};

const SIZES: Record<ButtonSize, string> = {
  md: "px-5 py-2.5 text-[15px] min-h-[44px]",
  lg: "w-full px-6 py-3.5 text-[16px] min-h-[52px]",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  onClick,
  type = "button",
  children,
  className = "",
  id,
}: ButtonProps) {
  const reduced = useReducedMotion();

  return (
    <motion.button
      id={id}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileTap={reduced ? {} : { scale: 0.98 }}
      transition={{ duration: 0.1 }}
      className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            />
          </svg>
          <span>Loading...</span>
        </span>
      ) : (
        children
      )}
    </motion.button>
  );
}
