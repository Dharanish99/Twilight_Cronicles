"use client";
import type { AvatarId } from "@twilight/shared-types";

// 8 color/pattern variants as specified in §6
const AVATAR_CONFIG: Record<AvatarId, { bg: string; fg: string; pattern: string }> = {
  ember:  { bg: "hsl(18 76% 52%)",   fg: "#fff",     pattern: "radial" },
  dusk:   { bg: "hsl(250 40% 35%)",  fg: "#F3EEE6",  pattern: "diagonal" },
  stone:  { bg: "hsl(30 12% 42%)",   fg: "#fff",     pattern: "solid" },
  sage:   { bg: "hsl(160 30% 40%)",  fg: "#fff",     pattern: "dots" },
  plum:   { bg: "hsl(290 35% 38%)",  fg: "#fff",     pattern: "grid" },
  gold:   { bg: "hsl(44 80% 48%)",   fg: "#2A2622",  pattern: "solid" },
  slate:  { bg: "hsl(210 25% 38%)",  fg: "#fff",     pattern: "diagonal" },
  rose:   { bg: "hsl(340 55% 55%)",  fg: "#fff",     pattern: "radial" },
};

type ConnectionStatus = "connected" | "reconnecting" | "disconnected";

interface PlayerAvatarProps {
  avatar: AvatarId;
  name?: string;
  size?: "sm" | "md" | "lg";
  connection?: ConnectionStatus;
}

const SIZES = {
  sm: { outer: "w-8 h-8", text: "text-xs", ring: "w-2.5 h-2.5" },
  md: { outer: "w-12 h-12", text: "text-sm", ring: "w-3 h-3" },
  lg: { outer: "w-16 h-16", text: "text-base", ring: "w-3.5 h-3.5" },
};

const CONNECTION_RING: Record<ConnectionStatus, string> = {
  connected: "bg-[var(--success)]",
  reconnecting: "bg-[var(--cat-playful)] animate-pulse",
  disconnected: "bg-[var(--danger)]",
};

export function PlayerAvatar({
  avatar,
  name = "?",
  size = "md",
  connection,
}: PlayerAvatarProps) {
  const config = AVATAR_CONFIG[avatar] ?? AVATAR_CONFIG.ember;
  const sz = SIZES[size];
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <div className={`relative inline-flex shrink-0 ${sz.outer}`}>
      <div
        className={`w-full h-full rounded-full flex items-center justify-center font-semibold ${sz.text}`}
        style={{ background: config.bg, color: config.fg }}
        aria-label={`Avatar for ${name}`}
      >
        {initials}
      </div>
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
