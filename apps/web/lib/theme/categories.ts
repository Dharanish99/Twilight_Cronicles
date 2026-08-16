import type { CategoryId } from "@twilight/shared-types";

export interface CategoryDef {
  label: string;
  blurb: string;
  accent: string;           // CSS custom property name
  intensityRange: [number, number];
  defaultEnabled: boolean | string;
  emoji: string;
}

export const CATEGORIES: Record<CategoryId, CategoryDef> = {
  deep: {
    label: "Deep",
    blurb: "Questions that make you stop and think.",
    accent: "--cat-deep",
    intensityRange: [2, 5],
    defaultEnabled: true,
    emoji: "🌊",
  },
  playful: {
    label: "Playful",
    blurb: "Expect chaos, bad decisions, and laughter.",
    accent: "--cat-playful",
    intensityRange: [1, 3],
    defaultEnabled: true,
    emoji: "✨",
  },
  emotional: {
    label: "Emotional",
    blurb: "Some things are easier to say when a game asks first.",
    accent: "--cat-emotional",
    intensityRange: [2, 5],
    defaultEnabled: true,
    emoji: "🌸",
  },
  curious: {
    label: "Curious",
    blurb: "Little questions that reveal surprisingly big things.",
    accent: "--cat-curious",
    intensityRange: [1, 3],
    defaultEnabled: true,
    emoji: "🔍",
  },
  memories: {
    label: "Memories",
    blurb: "Go back for a second.",
    accent: "--cat-memories",
    intensityRange: [1, 4],
    defaultEnabled: true,
    emoji: "📷",
  },
  future: {
    label: "Future",
    blurb: "Where this is all headed.",
    accent: "--cat-future",
    intensityRange: [1, 4],
    defaultEnabled: true,
    emoji: "🌅",
  },
  chaotic: {
    label: "Chaotic / Random",
    blurb: "No theme. No warning.",
    accent: "--cat-chaotic",
    intensityRange: [1, 3],
    defaultEnabled: true,
    emoji: "🎲",
  },
  wouldYouRather: {
    label: "Would You Rather",
    blurb: "Choose. Then explain yourself.",
    accent: "--cat-would-you-rather",
    intensityRange: [1, 3],
    defaultEnabled: true,
    emoji: "⚖️",
  },
  friendship: {
    label: "Friendship",
    blurb: "For the ones who already know too much.",
    accent: "--cat-friendship",
    intensityRange: [1, 4],
    defaultEnabled: "relationship:friends",
    emoji: "🤝",
  },
  gettingToKnowYou: {
    label: "Getting to Know You",
    blurb: "First layers, not deep cuts.",
    accent: "--cat-getting-to-know-you",
    intensityRange: [1, 2],
    defaultEnabled: "relationship:new",
    emoji: "👋",
  },
};

export function getCategoryAccentVar(id: CategoryId): string {
  return CATEGORIES[id]?.accent ?? "--cat-deep";
}

export function getCategoryColor(id: CategoryId): string {
  return `var(${getCategoryAccentVar(id)})`;
}

export const CATEGORY_IDS = Object.keys(CATEGORIES) as CategoryId[];
