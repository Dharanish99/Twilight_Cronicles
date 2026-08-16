"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { PlayerAvatar, AVATAR_IDS } from "@/components/ui/PlayerAvatar";
import { ConnectionIndicator } from "@/components/ui/ConnectionIndicator";
import { RoomCodeDisplay } from "@/components/ui/RoomCodeDisplay";
import { TurnIndicator } from "@/components/ui/TurnIndicator";
import { Dialog } from "@/components/ui/Dialog";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { CategoryCard } from "@/components/game/CategoryCard";
import { CATEGORY_IDS } from "@/lib/theme/categories";
import { useThemeStore } from "@/lib/state/themeStore";

export default function DevComponentsPage() {
  const { theme, toggleTheme } = useThemeStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface-base text-ink-primary p-6 sm:p-12 flex flex-col gap-12 max-w-4xl mx-auto">
      <header className="flex justify-between items-center border-b border-theme-subtle pb-4">
        <div>
          <h1 className="font-display text-3xl font-serif">Component Showcase (_dev)</h1>
          <p className="text-sm text-ink-secondary">
            Design tokens, interactive primitives, and game states
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={toggleTheme}>
            Toggle Theme ({theme})
          </Button>
          <Link href="/">
            <Button variant="text">Home</Button>
          </Link>
        </div>
      </header>

      {/* Buttons */}
      <section className="flex flex-col gap-4">
        <h2 className="category-label text-[var(--accent-ember)] font-semibold">Buttons</h2>
        <div className="flex flex-wrap gap-3 items-center">
          <Button variant="primary">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="text">Text Button</Button>
          <Button variant="primary" loading>Loading State</Button>
          <Button variant="primary" disabled>Disabled State</Button>
        </div>
      </section>

      {/* Avatars */}
      <section className="flex flex-col gap-4">
        <h2 className="category-label text-[var(--accent-ember)] font-semibold">Player Avatars (8 Palette Variants)</h2>
        <div className="flex flex-wrap gap-4 items-center">
          {AVATAR_IDS.map((a) => (
            <div key={a} className="flex flex-col items-center gap-1">
              <PlayerAvatar avatar={a} name={a} size="md" connection="connected" />
              <span className="text-xs text-ink-tertiary">{a}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Connection & Turn Indicators */}
      <section className="flex flex-col gap-4">
        <h2 className="category-label text-[var(--accent-ember)] font-semibold">Status &amp; Turn Indicators</h2>
        <div className="flex flex-wrap gap-6 items-center">
          <ConnectionIndicator status="connected" />
          <ConnectionIndicator status="reconnecting" />
          <ConnectionIndicator status="lost" />
        </div>
        <div className="p-4 bg-surface-elevated rounded border border-theme-subtle">
          <TurnIndicator
            round={3}
            totalRounds={6}
            roleDescription="You are choosing a mood for Jordan"
          />
        </div>
      </section>

      {/* Room Code Display */}
      <section className="flex flex-col gap-4">
        <h2 className="category-label text-[var(--accent-ember)] font-semibold">Room Code Display</h2>
        <div className="flex justify-center">
          <RoomCodeDisplay code="7X9K2M" />
        </div>
      </section>

      {/* Category Cards */}
      <section className="flex flex-col gap-4">
        <h2 className="category-label text-[var(--accent-ember)] font-semibold">Mood Category Cards (10 Themes)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CATEGORY_IDS.map((cat) => (
            <CategoryCard
              key={cat}
              category={cat}
              onSelect={(c) => console.log("Selected:", c)}
            />
          ))}
        </div>
      </section>

      {/* Overlays */}
      <section className="flex flex-col gap-4">
        <h2 className="category-label text-[var(--accent-ember)] font-semibold">Modals &amp; Sheets</h2>
        <div className="flex gap-4">
          <Button variant="secondary" onClick={() => setDialogOpen(true)}>
            Open Dialog
          </Button>
          <Button variant="secondary" onClick={() => setSheetOpen(true)}>
            Open Bottom Sheet
          </Button>
        </div>

        <Dialog
          open={dialogOpen}
          title="Sample Dialog Modal"
          description="This is a fully accessible dialog modal with focus trap and keyboard dismissal."
          onConfirm={() => setDialogOpen(false)}
          onCancel={() => setDialogOpen(false)}
        />

        <BottomSheet
          open={sheetOpen}
          title="Sample Bottom Sheet"
          onClose={() => setSheetOpen(false)}
        >
          <p className="text-sm text-ink-secondary">
            Bottom sheet content that smoothly animates upward on mobile and behaves gracefully on desktop.
          </p>
        </BottomSheet>
      </section>
    </div>
  );
}
