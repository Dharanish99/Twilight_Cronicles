"use client";
import { motion } from "framer-motion";
import type { CategoryId } from "@twilight/shared-types";
import { CATEGORIES, getCategoryColor } from "@/lib/theme/categories";
import { categoryCardItem, categoryCardPress } from "@/lib/theme/motion";
import { useReducedMotion } from "@/lib/a11y/useReducedMotion";

interface CategoryCardProps {
  category: CategoryId;
  gentle?: boolean;
  onSelect: (category: CategoryId) => void;
  disabled?: boolean;
}

export function CategoryCard({ category, gentle = false, onSelect, disabled = false }: CategoryCardProps) {
  const reduced = useReducedMotion();
  const def = CATEGORIES[category];
  const press = categoryCardPress(reduced);
  const itemAnim = categoryCardItem(reduced);
  const accentColor = getCategoryColor(category);

  return (
    <motion.button
      variants={itemAnim}
      onClick={() => !disabled && onSelect(category)}
      disabled={disabled}
      whileTap={press.whileTap}
      style={{ "--cat-color": accentColor } as React.CSSProperties}
      className="relative group text-left rounded-[var(--radius-md)] p-5
        bg-[var(--bg-elevated)] border border-[var(--border-subtle)]
        hover:border-[var(--cat-color)] hover:shadow-[var(--shadow-md)]
        transition-all duration-150 cursor-pointer disabled:opacity-50
        disabled:cursor-not-allowed w-full min-h-[120px] flex flex-col gap-2"
      aria-label={`Select ${def?.label} category`}
      id={`category-${category}`}
    >
      {/* Color accent bar */}
      <div
        className="absolute top-0 left-0 w-1 h-full rounded-l-[var(--radius-md)] transition-opacity duration-150 opacity-0 group-hover:opacity-100"
        style={{ background: accentColor }}
        aria-hidden="true"
      />

      {/* Emoji + label row */}
      <div className="flex items-center gap-2">
        <span className="text-xl" aria-hidden="true">{def?.emoji}</span>
        <div className="flex items-center gap-2">
          <span
            className="category-label"
            style={{ color: accentColor }}
          >
            {def?.label}
          </span>
          {gentle && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--bg-sunken)] text-[var(--ink-tertiary)] font-medium uppercase tracking-wide">
              gentle
            </span>
          )}
        </div>
      </div>

      {/* Blurb */}
      <p className="text-sm text-[var(--ink-secondary)] leading-snug">
        {def?.blurb}
      </p>
    </motion.button>
  );
}
