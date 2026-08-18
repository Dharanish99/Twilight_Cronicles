"use client";
import type { AvatarId } from "@twilight/shared-types";
import { Sigil } from "./Sigil";

// 8 color/pattern variants as specified in §6
// Background colors kept for the Sigil background; initials are removed.
export const AVATAR_CONFIG: Record<AvatarId, { bg: string; fg: string }> = {
  ember: { bg: "hsl(18 76% 52%)",   fg: "#fff"     },
  dusk:  { bg: "hsl(250 40% 35%)",  fg: "#F3EEE6"  },
  stone: { bg: "hsl(30 12% 42%)",   fg: "#fff"     },
  sage:  { bg: "hsl(160 30% 40%)",  fg: "#fff"     },
  plum:  { bg: "hsl(290 35% 38%)",  fg: "#fff"     },
  gold:  { bg: "hsl(44 80% 48%)",   fg: "#2A2622"  },
  slate: { bg: "hsl(210 25% 38%)",  fg: "#fff"     },
  rose:  { bg: "hsl(340 55% 55%)",  fg: "#fff"     },
};

type ConnectionStatus = "connected" | "reconnecting" | "disconnected";

interface PlayerAvatarProps {
  avatar: AvatarId;
  name?: string;
  size?: "sm" | "md" | "lg";
  connection?: ConnectionStatus;
}

const SIZES = {
  sm: { px: 32, ring: "w-2.5 h-2.5" },
  md: { px: 48, ring: "w-3 h-3"     },
  lg: { px: 64, ring: "w-3.5 h-3.5" },
};

const CONNECTION_RING: Record<ConnectionStatus, string> = {
  connected:    "bg-[var(--success)]",
  reconnecting: "bg-[var(--cat-playful)] animate-pulse",
  disconnected: "bg-[var(--danger)]",
};

export function PlayerAvatar({
  avatar,
  name = "?",
  size = "md",
  connection,
}: PlayerAvatarProps) {
  const sz = SIZES[size];
  // Sigil seed: avatar + name — stable for session (doesn't change if name changes mid-game)
  const seed = avatar + name;

  return (
    <div className="relative inline-flex shrink-0" style={{ width: sz.px, height: sz.px }}>
      <Sigil seed={seed} size={sz.px} avatarId={avatar} name={name} />
      {connection && (
        <span
          className={`absolute bottom-0 right-0 ${sz.ring} rounded-full border-2 border-[var(--bg-elevated)] ${CONNECTION_RING[connection]}`}
          aria-label={`Connection: ${connection}`}
        />
      )}
    </div>
  );
}

export const AVATAR_IDS: AvatarId[] = [
  "ember", "dusk", "stone", "sage", "plum", "gold", "slate", "rose"
];
