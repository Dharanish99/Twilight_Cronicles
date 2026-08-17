import type { CategoryId } from "@twilight/shared-types";

interface CategoryIconProps {
  category: CategoryId;
  size?: number;
  className?: string;
}

/** Stroke-only SVG icons per category. Color via CSS var token per category. */
export function CategoryIcon({ category, size = 20, className = "" }: CategoryIconProps) {
  const stroke = `var(--cat-${toKebab(category)})`;
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke,
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };

  switch (category) {
    case "deep":
      // Concentric ripple — still water going deep
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="12" r="5.5" strokeOpacity="0.6" />
          <circle cx="12" cy="12" r="9" strokeOpacity="0.3" />
        </svg>
      );

    case "playful":
      // Asymmetric spark burst
      return (
        <svg {...props}>
          <line x1="12" y1="3" x2="12" y2="6" />
          <line x1="19.07" y1="4.93" x2="17.36" y2="6.64" />
          <line x1="21" y1="12" x2="18" y2="12" />
          <line x1="19.07" y1="19.07" x2="17.36" y2="17.36" />
          <line x1="12" y1="21" x2="12" y2="18" />
          <line x1="4.93" y1="19.07" x2="6.64" y2="17.36" />
          <line x1="3" y1="12" x2="6" y2="12" />
          <line x1="4.93" y1="4.93" x2="6.64" y2="6.64" />
        </svg>
      );

    case "emotional":
      // Open blossom / soft bloom outline
      return (
        <svg {...props}>
          <path d="M12 3 C10 7, 6 8, 6 12 C6 16.4 8.7 19 12 21 C15.3 19 18 16.4 18 12 C18 8 14 7 12 3Z" />
          <path d="M12 21 L12 12" strokeOpacity="0.5" />
          <path d="M9 15 C9 15 10.5 13.5 12 14 C13.5 13.5 15 15 15 15" strokeOpacity="0.5" />
        </svg>
      );

    case "curious":
      // Minimal magnifying glass / loupe
      return (
        <svg {...props}>
          <circle cx="10.5" cy="10.5" r="6.5" />
          <line x1="15.5" y1="15.5" x2="21" y2="21" />
        </svg>
      );

    case "memories":
      // Aperture / camera frame mark
      return (
        <svg {...props}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="12" cy="12" r="3.5" />
          <line x1="3" y1="9" x2="7" y2="9" strokeOpacity="0.5" />
        </svg>
      );

    case "future":
      // Horizon line with a small rising mark above it
      return (
        <svg {...props}>
          <line x1="3" y1="16" x2="21" y2="16" />
          <polyline points="8,16 12,8 16,16" />
          <line x1="12" y1="8" x2="12" y2="5" />
          <circle cx="12" cy="4" r="1" fill={stroke} stroke="none" />
        </svg>
      );

    case "chaotic":
      // Scatter of irregular dots
      return (
        <svg {...props}>
          <circle cx="7" cy="8" r="1.5" fill={stroke} stroke="none" />
          <circle cx="15" cy="6" r="1" fill={stroke} stroke="none" />
          <circle cx="18" cy="14" r="1.5" fill={stroke} stroke="none" />
          <circle cx="9" cy="17" r="1" fill={stroke} stroke="none" />
          <circle cx="13" cy="12" r="2" fill={stroke} stroke="none" strokeOpacity="0.4" />
        </svg>
      );

    case "wouldYouRather":
      // Forked path / diverging road
      return (
        <svg {...props}>
          <line x1="12" y1="3" x2="12" y2="10" />
          <path d="M12 10 L6 19" />
          <path d="M12 10 L18 19" />
        </svg>
      );

    case "friendship":
      // Two interlocking rings
      return (
        <svg {...props}>
          <circle cx="9" cy="12" r="5" />
          <circle cx="15" cy="12" r="5" />
        </svg>
      );

    case "gettingToKnowYou":
      // Partially-open door outline
      return (
        <svg {...props}>
          <rect x="4" y="3" width="16" height="19" rx="1" />
          <path d="M4 3 L4 22" />
          <path d="M20 3 L20 22" strokeOpacity="0.3" />
          <line x1="4" y1="22" x2="20" y2="22" />
          <circle cx="16" cy="12" r="1" fill={stroke} stroke="none" />
        </svg>
      );

    default:
      return null;
  }
}

/** Convert camelCase category id to kebab-case for CSS var lookup */
function toKebab(str: string): string {
  return str.replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`);
}
