"use client";

interface TurnIndicatorProps {
  round: number;
  totalRounds: number;
  roleDescription: string;
}

export function TurnIndicator({
  round,
  totalRounds,
  roleDescription,
}: TurnIndicatorProps) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="category-label text-[var(--accent-ember)] font-semibold">
        Round {round} of {totalRounds}
      </span>
      <span className="text-ink-secondary font-medium">
        {roleDescription}
      </span>
    </div>
  );
}
