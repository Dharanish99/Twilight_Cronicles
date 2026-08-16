"use client";
import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface RoomCodeDisplayProps {
  code: string;
  label?: string;
}

export function RoomCodeDisplay({ code, label = "Room code" }: RoomCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {label && (
        <span className="category-label text-[var(--ink-tertiary)]">{label}</span>
      )}
      <button
        onClick={handleCopy}
        className="flex items-center gap-3 px-5 py-3 bg-[var(--bg-sunken)] rounded-[var(--radius-md)] border border-[var(--border-subtle)] hover:border-[var(--accent-ember)] transition-colors group min-h-[56px] min-w-[180px]"
        aria-label={copied ? "Code copied!" : `Copy room code: ${code}`}
        id="room-code-display"
      >
        <span className="font-mono text-2xl font-bold tracking-[0.15em] text-[var(--ink-primary)] flex-1 text-center">
          {code}
        </span>
        <span className={`shrink-0 transition-colors ${copied ? "text-[var(--success)]" : "text-[var(--ink-tertiary)] group-hover:text-[var(--accent-ember)]"}`}>
          {copied ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
        </span>
      </button>
      {copied && (
        <span className="text-[var(--success)] text-xs" role="status" aria-live="polite">
          Copied to clipboard
        </span>
      )}
    </div>
  );
}
