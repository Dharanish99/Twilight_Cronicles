"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import type {
  AvatarId,
  CategoryId,
  IntensityCeiling,
  RelationshipType,
  RoomSettings,
} from "@twilight/shared-types";
import { useGameStore } from "@/lib/state/gameStore";
import { Button } from "@/components/ui/Button";
import { PlayerAvatar, AVATAR_IDS } from "@/components/ui/PlayerAvatar";
import { CATEGORIES, CATEGORY_IDS } from "@/lib/theme/categories";
import { ToastContainer } from "@/components/ui/Toast";
import { CategoryIcon } from "@/components/ui/CategoryIcon";

export function CreateForm() {
  const router = useRouter();
  const { createRoom, room, setLocalPlayer, toasts, removeToast } = useGameStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [displayName, setDisplayName] = useState("");
  const [avatar, setAvatar] = useState<AvatarId>("ember");
  const [relationshipType, setRelationshipType] = useState<RelationshipType>("friends");

  // Settings
  const [rounds, setRounds] = useState<number>(6);
  const [intensityCeiling, setIntensityCeiling] = useState<IntensityCeiling>("balanced");
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<CategoryId[]>([
    "deep", "playful", "emotional", "curious", "memories", "future", "wouldYouRather", "friendship",
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (room && room.roomId) router.push(`/room/${room.roomId}/lobby`);
  }, [room, router]);

  const handleToggleCategory = (catId: CategoryId) => {
    if (selectedCategories.includes(catId)) {
      if (selectedCategories.length > 2) {
        setSelectedCategories(selectedCategories.filter((c) => c !== catId));
      }
    } else {
      setSelectedCategories([...selectedCategories, catId]);
    }
  };

  const handleCreate = () => {
    if (!displayName.trim()) return;
    setIsSubmitting(true);
    const settings: RoomSettings = { rounds, intensityCeiling, categories: selectedCategories, timerSeconds };
    setLocalPlayer({ id: "host", displayName: displayName.trim(), avatar, relationshipType });
    createRoom(displayName.trim(), avatar, settings, relationshipType);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--ink-primary)] flex flex-col justify-between p-5 sm:p-8">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      <header className="max-w-2xl mx-auto w-full flex items-center justify-between py-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] transition-colors"
        >
          <ArrowLeft size={16} /> Back to Home
        </Link>
        <span className="category-label text-[var(--ink-tertiary)]">Step {step} of 2</span>
      </header>

      <main className="max-w-xl mx-auto w-full my-auto py-8">
        {step === 1 ? (
          <div className="flex flex-col gap-8 animate-fadeIn">
            <div>
              <span className="category-label text-[var(--accent-ember)]">Host Setup</span>
              <h1 className="font-display text-3xl sm:text-4xl text-[var(--ink-primary)] mt-2">
                Who is starting this game?
              </h1>
              <p className="text-[var(--ink-secondary)] text-sm mt-1">
                Your partner will see your name and avatar during the conversation.
              </p>
            </div>

            {/* Display Name */}
            <div className="flex flex-col gap-2">
              <label htmlFor="display-name" className="text-sm font-semibold text-[var(--ink-primary)]">
                Your Display Name
              </label>
              <input
                id="display-name"
                type="text"
                maxLength={24}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Maya, Jordan, Alex"
                className="w-full px-4 py-3 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-[var(--accent-ember)] outline-none text-base transition-colors"
                autoFocus
              />
            </div>

            {/* Avatar Picker */}
            <div className="flex flex-col gap-3">
              <label className="text-sm font-semibold text-[var(--ink-primary)]">Choose an Avatar</label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-3" role="radiogroup" aria-label="Avatar options">
                {AVATAR_IDS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAvatar(a)}
                    className={`flex flex-col items-center justify-center p-2 rounded-[var(--radius-md)] transition-transform ${
                      avatar === a
                        ? "ring-2 ring-[var(--accent-ember)] ring-offset-2 scale-110 bg-[var(--bg-elevated)]"
                        : "hover:scale-105 opacity-80 hover:opacity-100"
                    }`}
                    aria-label={`Select avatar ${a}`}
                    aria-checked={avatar === a}
                    role="radio"
                  >
                    <PlayerAvatar avatar={a} name={displayName || "You"} size="sm" />
                    <span className="text-[10px] text-[var(--ink-tertiary)] mt-1 capitalize">{a}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Relationship Selector */}
            <div className="flex flex-col gap-3">
              <label className="text-sm font-semibold text-[var(--ink-primary)]">Who are you playing with?</label>
              <div className="grid grid-cols-3 gap-3" role="radiogroup">
                {[
                  { id: "friends", label: "Friends", icon: "🤝" },
                  { id: "more_than_friends", label: "More than friends", icon: "✨" },
                  { id: "just_meeting", label: "Just meeting", icon: "👋" },
                ].map((rel) => (
                  <button
                    key={rel.id}
                    type="button"
                    onClick={() => setRelationshipType(rel.id as RelationshipType)}
                    className={`flex flex-col items-center justify-center p-3 rounded-[var(--radius-sm)] border text-center transition-all ${
                      relationshipType === rel.id
                        ? "border-[var(--accent-ember)] bg-[var(--accent-ember-tint)] text-[var(--ink-primary)] font-semibold shadow-sm"
                        : "border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--ink-secondary)] hover:border-[var(--ink-tertiary)]"
                    }`}
                    aria-checked={relationshipType === rel.id}
                    role="radio"
                  >
                    <span className="text-xl mb-1">{rel.icon}</span>
                    <span className="text-xs leading-tight">{rel.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              disabled={!displayName.trim()}
              onClick={() => setStep(2)}
              id="continue-to-settings-btn"
            >
              Continue to Room Settings <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-8 animate-fadeIn">
            <div>
              <span className="category-label text-[var(--accent-ember)]">Session Settings</span>
              <h1 className="font-display text-3xl sm:text-4xl text-[var(--ink-primary)] mt-2">
                Configure the Evening
              </h1>
              <p className="text-[var(--ink-secondary)] text-sm mt-1">
                Customize pacing, intensity, and active moods.
              </p>
            </div>

            {/* Total Questions */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-[var(--ink-primary)]">
                Total Questions (shared between both players)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[6, 10, 15, 20].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRounds(r)}
                    className={`py-2.5 rounded-[var(--radius-sm)] border font-medium text-sm transition-all ${
                      rounds === r
                        ? "border-[var(--accent-ember)] bg-[var(--accent-ember)] text-white shadow-sm"
                        : "border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--ink-primary)] hover:border-[var(--ink-tertiary)]"
                    }`}
                  >
                    {r} Qs
                  </button>
                ))}
              </div>
            </div>

            {/* Intensity Ceiling */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-[var(--ink-primary)]">Intensity Level</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "gentle", label: "Gentle", desc: "Light & playful" },
                  { id: "balanced", label: "Balanced", desc: "Natural progression" },
                  { id: "unfiltered", label: "Unfiltered", desc: "No guardrails" },
                ].map((lvl) => (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setIntensityCeiling(lvl.id as IntensityCeiling)}
                    className={`p-3 rounded-[var(--radius-sm)] border text-left flex flex-col transition-all ${
                      intensityCeiling === lvl.id
                        ? "border-[var(--accent-ember)] bg-[var(--accent-ember-tint)] text-[var(--ink-primary)] font-semibold"
                        : "border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--ink-secondary)] hover:border-[var(--ink-tertiary)]"
                    }`}
                  >
                    <span className="text-sm font-medium">{lvl.label}</span>
                    <span className="text-[11px] text-[var(--ink-tertiary)] mt-0.5">{lvl.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Timer Option */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-[var(--ink-primary)]">Answer Timer</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: null, label: "None" },
                  { id: 60, label: "60s" },
                  { id: 90, label: "90s" },
                  { id: 120, label: "120s" },
                ].map((t) => (
                  <button
                    key={String(t.id)}
                    type="button"
                    onClick={() => setTimerSeconds(t.id)}
                    className={`py-2 rounded-[var(--radius-sm)] border font-medium text-xs transition-all ${
                      timerSeconds === t.id
                        ? "border-[var(--accent-ember)] bg-[var(--accent-ember-tint)] text-[var(--ink-primary)] font-semibold"
                        : "border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--ink-secondary)] hover:border-[var(--ink-tertiary)]"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category selection */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-[var(--ink-primary)]">
                  Available Moods ({selectedCategories.length} selected)
                </label>
                <span className="text-xs text-[var(--ink-tertiary)]">Min 2</span>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                {CATEGORY_IDS.map((catId) => {
                  const def = CATEGORIES[catId];
                  const isChecked = selectedCategories.includes(catId);
                  return (
                    <button
                      key={catId}
                      type="button"
                      onClick={() => handleToggleCategory(catId)}
                      className={`flex items-center gap-2 p-2 rounded-[var(--radius-sm)] border text-left text-xs transition-all ${
                        isChecked
                          ? "border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--ink-primary)] font-medium"
                          : "border-transparent opacity-40 hover:opacity-70"
                      }`}
                    >
                      <CategoryIcon category={catId} size={16} />
                      <span className="truncate">{def.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button
                variant="primary"
                onClick={handleCreate}
                loading={isSubmitting}
                className="flex-2"
                id="create-room-submit-btn"
              >
                <Sparkles size={16} className="mr-2" /> Create Game Room
              </Button>
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-2xl mx-auto w-full text-center py-4 text-xs text-[var(--ink-tertiary)]">
        Rooms expire automatically after 24 hours of inactivity.
      </footer>
    </div>
  );
}
