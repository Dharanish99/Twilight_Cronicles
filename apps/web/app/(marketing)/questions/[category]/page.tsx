import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CATEGORIES } from "@/lib/theme/categories";
import type { CategoryId } from "@twilight/shared-types";
import { CategoryIcon } from "@/components/ui/CategoryIcon";

interface PageProps {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  const def = CATEGORIES[category as CategoryId];
  if (!def) return { title: "Category Not Found" };
  return {
    title: `${def.label} Questions`,
    description: `${def.blurb} Explore ${def.label.toLowerCase()} conversation questions in Twilight Chronicles.`,
  };
}

export async function generateStaticParams() {
  return Object.keys(CATEGORIES).map((category) => ({ category }));
}

export default async function CategoryPage({ params }: PageProps) {
  const { category } = await params;
  const def = CATEGORIES[category as CategoryId];
  if (!def) notFound();

  return (
    <div className="max-w-2xl mx-auto px-5 py-16 sm:py-24">
      <div className="flex items-center gap-2 mb-2">
        <CategoryIcon category={category as CategoryId} size={28} aria-hidden />
        <span className="category-label" style={{ color: `var(${def.accent})` }}>
          {def.label}
        </span>
      </div>
      <h1 className="font-display text-4xl sm:text-5xl text-[var(--ink-primary)] mt-3 mb-4">
        {def.label} Questions
      </h1>
      <p className="text-xl text-[var(--ink-secondary)] mb-10 leading-relaxed">
        {def.blurb}
      </p>

      <div className="p-6 rounded-[var(--radius-lg)] bg-[var(--bg-sunken)] border border-[var(--border-subtle)] mb-10">
        <p className="text-[var(--ink-secondary)] text-sm leading-relaxed">
          Questions in the <strong className="text-[var(--ink-primary)]">{def.label}</strong> category
          range in intensity from{" "}
          <strong className="text-[var(--ink-primary)]">{def.intensityRange[0]}</strong> to{" "}
          <strong className="text-[var(--ink-primary)]">{def.intensityRange[1]}</strong>.
          The exact question is selected dynamically by the Twilight Chronicles engine to maintain natural progression.
        </p>
      </div>

      <div className="flex gap-4 flex-wrap">
        <Link
          href="/create"
          className="px-6 py-3.5 bg-[var(--accent-ember)] text-white rounded-[var(--radius-sm)] font-semibold hover:bg-[var(--accent-ember-hover)] transition-colors min-h-[48px] flex items-center"
        >
          Play with this Mood
        </Link>
        <Link
          href="/how-it-works"
          className="px-6 py-3.5 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--ink-primary)] rounded-[var(--radius-sm)] font-medium hover:border-[var(--accent-ember)] transition-colors min-h-[48px] flex items-center"
        >
          How It Works
        </Link>
      </div>
    </div>
  );
}
