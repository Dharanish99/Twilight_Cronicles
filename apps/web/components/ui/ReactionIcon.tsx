"use client";

/**
 * ReactionIcon — custom line-art reaction icons.
 * Five variants, ~1.6px stroke, no fill at rest.
 * On filled=true: stroke + fill with accentColor.
 * Zero emoji characters.
 */

export type ReactionVariant = "heart" | "spark" | "soft" | "blush" | "wow";

interface ReactionIconProps {
  variant: ReactionVariant;
  filled?: boolean;
  accentColor?: string;
  size?: number;
}

export function ReactionIcon({
  variant,
  filled = false,
  accentColor = "var(--accent-ember)",
  size = 22,
}: ReactionIconProps) {
  const stroke = filled ? accentColor : "currentColor";
  const fill   = filled ? accentColor : "none";
  const strokeW = 1.6;

  const baseProps = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke,
    strokeWidth: strokeW,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (variant) {
    // Heart outline — classic but line-art (no emoji)
    case "heart":
      return (
        <svg {...baseProps}>
          <path
            d="M12 21C12 21 3 14.5 3 8.5C3 5.46 5.46 3 8.5 3C10.24 3 11.8 3.85 12 5C12.2 3.85 13.76 3 15.5 3C18.54 3 21 5.46 21 8.5C21 14.5 12 21 12 21Z"
            fill={filled ? `${accentColor}55` : "none"}
            stroke={stroke}
          />
        </svg>
      );

    // Starburst / 6-point radiant spark
    case "spark":
      return (
        <svg {...baseProps}>
          <line x1="12" y1="2" x2="12" y2="6" />
          <line x1="12" y1="18" x2="12" y2="22" />
          <line x1="2" y1="12" x2="6" y2="12" />
          <line x1="18" y1="12" x2="22" y2="12" />
          <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
          <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
          <line x1="19.07" y1="4.93" x2="16.24" y2="7.76" />
          <line x1="7.76" y1="16.24" x2="4.93" y2="19.07" />
          <circle cx="12" cy="12" r="2.5" fill={fill} stroke={stroke} />
        </svg>
      );

    // Soft smile — gentle upward arc mouth, two small eyes
    case "soft":
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="12" r="9" stroke={stroke} fill={filled ? `${accentColor}22` : "none"} />
          {/* Eyes */}
          <circle cx="9" cy="10.5" r="0.8" fill={stroke} stroke="none" />
          <circle cx="15" cy="10.5" r="0.8" fill={stroke} stroke="none" />
          {/* Soft gentle smile */}
          <path d="M9 14.5 Q12 17 15 14.5" stroke={stroke} fill="none" />
        </svg>
      );

    // Blush / soft-face — face with rosy cheek dots
    case "blush":
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="12" r="9" stroke={stroke} fill={filled ? `${accentColor}22` : "none"} />
          {/* Eyes */}
          <circle cx="9.5" cy="10.5" r="0.8" fill={stroke} stroke="none" />
          <circle cx="14.5" cy="10.5" r="0.8" fill={stroke} stroke="none" />
          {/* Blush dots */}
          <circle cx="7.5" cy="13" r="1.2" fill={filled ? accentColor : `${stroke}44`} stroke="none" opacity={0.55} />
          <circle cx="16.5" cy="13" r="1.2" fill={filled ? accentColor : `${stroke}44`} stroke="none" opacity={0.55} />
          {/* Small smile */}
          <path d="M9.5 14.5 Q12 16.5 14.5 14.5" stroke={stroke} fill="none" />
        </svg>
      );

    // Wow — open mouth O, raised brows
    case "wow":
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="12" r="9" stroke={stroke} fill={filled ? `${accentColor}22` : "none"} />
          {/* Raised brows */}
          <path d="M8 9 Q9.5 7.5 11 9" stroke={stroke} fill="none" strokeWidth={1.4} />
          <path d="M13 9 Q14.5 7.5 16 9" stroke={stroke} fill="none" strokeWidth={1.4} />
          {/* Eyes */}
          <circle cx="9.5" cy="10.5" r="0.8" fill={stroke} stroke="none" />
          <circle cx="14.5" cy="10.5" r="0.8" fill={stroke} stroke="none" />
          {/* Open mouth O */}
          <ellipse cx="12" cy="15" rx="2" ry="2.2" stroke={stroke} fill={filled ? `${accentColor}55` : "none"} />
        </svg>
      );

    default:
      return null;
  }
}
