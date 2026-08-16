"use client";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

export type ConnectionStatus = "connected" | "reconnecting" | "disconnected" | "lost";

interface ConnectionIndicatorProps {
  status: ConnectionStatus;
  className?: string;
}

const CONFIG: Record<ConnectionStatus, { icon: typeof Wifi; label: string; dot: string }> = {
  connected:    { icon: Wifi,      label: "Connected",       dot: "bg-[var(--success)]" },
  reconnecting: { icon: RefreshCw, label: "Reconnecting…",   dot: "bg-[var(--cat-playful)] animate-pulse" },
  disconnected: { icon: WifiOff,   label: "Disconnected",    dot: "bg-[var(--danger)]" },
  lost:         { icon: WifiOff,   label: "Connection lost", dot: "bg-[var(--danger)]" },
};

export function ConnectionIndicator({ status, className = "" }: ConnectionIndicatorProps) {
  const config = CONFIG[status] ?? CONFIG.connected;
  const { label, dot } = config;

  return (
    <div
      className={`inline-flex items-center gap-1.5 text-xs text-[var(--ink-tertiary)] ${className}`}
      role="status"
      aria-live="polite"
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
