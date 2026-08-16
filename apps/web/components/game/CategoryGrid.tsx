"use client";
import { motion } from "framer-motion";
import type { CategoryId } from "@twilight/shared-types";
import { categoryGridContainer } from "@/lib/theme/motion";
import { useReducedMotion } from "@/lib/a11y/useReducedMotion";
import { CategoryCard } from "./CategoryCard";
import { CATEGORY_IDS } from "@/lib/theme/categories";

interface CategoryGridProps {
  enabledCategories?: CategoryId[];
  onSelect: (category: CategoryId) => void;
  disabled?: boolean;
  partnerName?: string;
}

export function CategoryGrid({
  enabledCategories,
  onSelect,
  disabled = false,
  partnerName,
}: CategoryGridProps) {
  const reduced = useReducedMotion();
  const containerAnim = categoryGridContainer(reduced);

  const categories = enabledCategories ?? (CATEGORY_IDS as CategoryId[]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <span className="category-label text-[var(--accent-ember)] font-semibold">
          Your Turn to Pick
        </span>
        <p className="text-ink-primary font-serif text-2xl mt-1">
          {partnerName
            ? `Choose a mood for ${partnerName}`
            : "What kind of conversation are you in the mood for?"}
        </p>
        <p className="text-ink-secondary text-sm mt-1">
          You select the category; Twilight Chronicles will pick the exact question for them to answer.
        </p>
      </div>
      <motion.div
        variants={containerAnim}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        role="group"
        aria-label="Category selection"
      >
        {categories.map((cat) => (
          <CategoryCard
            key={cat}
            category={cat}
            onSelect={onSelect}
            disabled={disabled}
          />
        ))}
      </motion.div>
    </div>
  );
}
