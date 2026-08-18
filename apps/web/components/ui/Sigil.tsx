"use client";

/**
 * Sigil — deterministic generative abstract line-mark.
 *
 * Algorithm:
 *  1. FNV-1a 32-bit hash of the seed string → stable unsigned int
 *  2. Extract bit-fields for: 3 primitives, their position, size, rotation, color
 *  3. Render within a circular SVG clip mask
 *
 * Same seed → always the same SVG output. No randomness at render time.
 * Accessibility: aria-label="{name}'s mark" — the sigil is decorative identity.
 */

import type { AvatarId } from "@twilight/shared-types";

// Background colors per avatar — mirrors AVATAR_CONFIG in PlayerAvatar
const AVATAR_BG: Record<AvatarId, string> = {
  ember: "hsl(18 76% 52%)",
  dusk:  "hsl(250 40% 35%)",
  stone: "hsl(30 12% 42%)",
  sage:  "hsl(160 30% 40%)",
  plum:  "hsl(290 35% 38%)",
  gold:  "hsl(44 80% 48%)",
  slate: "hsl(210 25% 38%)",
  rose:  "hsl(340 55% 55%)",
};

const AVATAR_FG: Record<AvatarId, string> = {
  ember: "#fff",
  dusk:  "#F3EEE6",
  stone: "#fff",
  sage:  "#fff",
  plum:  "#fff",
  gold:  "#2A2622",
  slate: "#fff",
  rose:  "#fff",
};

interface SigilProps {
  /** Stable seed — use `avatarId + displayName` or player ID if available */
  seed: string;
  /** Rendered size in px (the outer square; SVG viewBox is always 40×40) */
  size: number;
  /** AvatarId for color derivation — matches the player's chosen avatar */
  avatarId: AvatarId;
  /** Optional name for aria-label */
  name?: string;
}

// ── FNV-1a 32-bit hash (pure TS, no deps) ────────────────────────────────────
function fnv1a(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    // Multiply by FNV prime (16777619), then mask to 32 bits
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash;
}

// Pull N-bit field starting at bit-offset `offset` out of `hash`
function bits(hash: number, offset: number, width: number): number {
  return (hash >>> offset) & ((1 << width) - 1);
}

// Lerp a [0..max] integer field to a float in [min..max]
function remap(value: number, fieldMax: number, outMin: number, outMax: number): number {
  return outMin + (value / fieldMax) * (outMax - outMin);
}

// ── Primitives ────────────────────────────────────────────────────────────────
type Primitive = "arc" | "ring" | "line" | "cross" | "dot";
const PRIMITIVES: Primitive[] = ["arc", "ring", "line", "cross", "dot"];

interface PrimitiveSpec {
  type: Primitive;
  cx: number;   // center x in 40×40 viewBox
  cy: number;
  r: number;    // radius / half-length
  angle: number; // degrees, for line/arc/cross rotation
  opacity: number;
}

function generateSpecs(seed: string): PrimitiveSpec[] {
  const h0 = fnv1a(seed);
  const h1 = fnv1a(seed + "~b");
  const h2 = fnv1a(seed + "~c");

  return [
    {
      type:    PRIMITIVES[bits(h0, 0,  3) % PRIMITIVES.length]!,
      cx:      remap(bits(h0, 3,  5), 31, 8, 32),
      cy:      remap(bits(h0, 8,  5), 31, 8, 32),
      r:       remap(bits(h0, 13, 4), 15, 4, 12),
      angle:   remap(bits(h0, 17, 6), 63, 0, 180),
      opacity: remap(bits(h0, 23, 3),  7, 0.5, 1.0),
    },
    {
      type:    PRIMITIVES[bits(h1, 0,  3) % PRIMITIVES.length]!,
      cx:      remap(bits(h1, 3,  5), 31, 6, 34),
      cy:      remap(bits(h1, 8,  5), 31, 6, 34),
      r:       remap(bits(h1, 13, 4), 15, 3, 10),
      angle:   remap(bits(h1, 17, 6), 63, 0, 180),
      opacity: remap(bits(h1, 23, 3),  7, 0.4, 0.9),
    },
    {
      type:    PRIMITIVES[bits(h2, 0,  3) % PRIMITIVES.length]!,
      cx:      remap(bits(h2, 3,  5), 31, 10, 30),
      cy:      remap(bits(h2, 8,  5), 31, 10, 30),
      r:       remap(bits(h2, 13, 4), 15, 2,  7),
      angle:   remap(bits(h2, 17, 6), 63, 0, 180),
      opacity: remap(bits(h2, 23, 3),  7, 0.45, 0.85),
    },
  ];
}

function renderPrimitive(p: PrimitiveSpec, color: string, idx: number): React.ReactElement | null {
  const strokeProps = {
    stroke: color,
    strokeWidth: 1.6,
    fill: "none",
    opacity: p.opacity,
    strokeLinecap: "round" as const,
  };
  const transform = `rotate(${p.angle.toFixed(1)} ${p.cx.toFixed(1)} ${p.cy.toFixed(1)})`;

  switch (p.type) {
    case "arc":
      // A short arc — draw a quarter-circle arc at the position
      return (
        <path
          key={idx}
          d={`M ${(p.cx - p.r).toFixed(1)} ${p.cy.toFixed(1)} A ${p.r.toFixed(1)} ${p.r.toFixed(1)} 0 0 1 ${p.cx.toFixed(1)} ${(p.cy - p.r).toFixed(1)}`}
          {...strokeProps}
          transform={transform}
        />
      );
    case "ring":
      return (
        <circle
          key={idx}
          cx={p.cx}
          cy={p.cy}
          r={p.r}
          {...strokeProps}
        />
      );
    case "line":
      return (
        <line
          key={idx}
          x1={p.cx - p.r}
          y1={p.cy}
          x2={p.cx + p.r}
          y2={p.cy}
          {...strokeProps}
          transform={transform}
        />
      );
    case "cross":
      return (
        <g key={idx} transform={transform} opacity={p.opacity}>
          <line x1={p.cx - p.r} y1={p.cy} x2={p.cx + p.r} y2={p.cy} {...strokeProps} opacity={1} />
          <line x1={p.cx} y1={p.cy - p.r} x2={p.cx} y2={p.cy + p.r} {...strokeProps} opacity={1} />
        </g>
      );
    case "dot":
      return (
        <circle
          key={idx}
          cx={p.cx}
          cy={p.cy}
          r={p.r * 0.35}
          fill={color}
          opacity={p.opacity}
        />
      );
    default:
      return null;
  }
}

export function Sigil({ seed, size, avatarId, name }: SigilProps) {
  const bg    = AVATAR_BG[avatarId] ?? AVATAR_BG.ember;
  const fg    = AVATAR_FG[avatarId] ?? "#fff";
  const specs = generateSpecs(seed);
  const clipId = `sigil-clip-${fnv1a(seed).toString(16)}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      aria-label={name ? `${name}'s mark` : "Player sigil"}
      role="img"
      style={{ flexShrink: 0 }}
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx="20" cy="20" r="20" />
        </clipPath>
      </defs>

      {/* Background disc */}
      <circle cx="20" cy="20" r="20" fill={bg} />

      {/* Generated primitives, clipped to disc */}
      <g clipPath={`url(#${clipId})`}>
        {specs.map((s, i) => renderPrimitive(s, fg, i))}
      </g>
    </svg>
  );
}
