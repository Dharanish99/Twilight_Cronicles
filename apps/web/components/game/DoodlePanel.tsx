"use client";

/**
 * DoodlePanel — session-persistent doodle chat window.
 *
 * Two roles:
 *  - Waiting player (isWaiting=true): sees gallery + canvas + send
 *  - Answering/picker player (isWaiting=false): gallery view only
 *
 * Opens as a slide-up sheet from the bottom on mobile,
 * a right-side panel on wider screens.
 */

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { DoodleEntry } from "@twilight/shared-types";
import { EmojiPicker } from "@/components/ui/EmojiPicker";
import { Sigil } from "@/components/ui/Sigil";
import type { AvatarId } from "@twilight/shared-types";
import { useReducedMotion } from "@/lib/a11y/useReducedMotion";

// 5 brand-color drawing swatches
const PALETTE = [
  { label: "Ink",       hex: "#2A2622" },
  { label: "Ember",     hex: "#E1592A" },
  { label: "Deep",      hex: "#5B6FA8" },
  { label: "Gold",      hex: "#C88D1A" },
  { label: "Rose",      hex: "#C26B6B" },
];

interface Stroke {
  color: string;
  points: { x: number; y: number }[];
}

interface DoodlePanelProps {
  isOpen: boolean;
  onClose: () => void;
  /** Only the waiting (non-answering) player can draw and send */
  isWaiting: boolean;
  /** Current round number — tagged onto each doodle entry */
  currentRound: number;
  /** Session gallery of all sent doodles */
  gallery: DoodleEntry[];
  /** Current user's server-assigned player ID */
  myPlayerId: string;
  /** Partner's display name (for send button copy) */
  partnerName: string;
  /** Partner's avatar ID — for their sigil in the feed */
  partnerAvatarId: AvatarId;
  /** My avatar ID — for my sigil in the feed */
  myAvatarId: AvatarId;
  onSendDoodle: (dataUrl: string, round: number) => void;
  onReact: (doodleId: string, emoji: string) => void;
}

// ── Doodle feed item ──────────────────────────────────────────────────────────
function DoodleFeedItem({
  entry,
  isOwn,
  myPlayerId,
  onReact,
}: {
  entry: DoodleEntry;
  isOwn: boolean;
  myPlayerId: string;
  onReact: (doodleId: string, emoji: string) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const myReaction = entry.reactions[myPlayerId];
  const partnerReactions = Object.entries(entry.reactions)
    .filter(([pid]) => pid !== myPlayerId)
    .map(([, emoji]) => emoji);

  return (
    <div className={`flex flex-col gap-1.5 ${isOwn ? "items-end" : "items-start"}`}>
      {/* Sender label */}
      <span className="text-[10px] uppercase tracking-widest text-[var(--ink-tertiary)] font-semibold px-1">
        {isOwn ? "You" : entry.senderName} · Round {entry.round}
      </span>

      {/* Doodle image bubble */}
      <div
        className={`relative rounded-[var(--radius-md)] overflow-hidden border max-w-[85%]
          ${isOwn
            ? "border-[var(--accent-ember)] border-opacity-40 rounded-tr-sm"
            : "border-[var(--border-subtle)] rounded-tl-sm"
          }`}
        style={{ boxShadow: "var(--shadow-sm)" }}
      >
        <img
          src={entry.dataUrl}
          alt={`Doodle from ${entry.senderName}`}
          className="w-full max-h-52 object-contain block"
          style={{ background: "#ffffff" }}
        />
      </div>

      {/* Reaction strip */}
      <div className="relative flex items-center gap-1.5 px-1">
        {/* Partner's reactions (display only) */}
        {partnerReactions.map((e, i) => (
          <span key={i} className="text-lg" aria-label={`${entry.senderName} reacted ${e}`}>{e}</span>
        ))}

        {/* My current reaction */}
        {myReaction && (
          <span className="text-lg" aria-label={`You reacted ${myReaction}`}>{myReaction}</span>
        )}

        {/* React / change reaction button */}
        <div className="relative">
          <button
            onClick={() => setPickerOpen((v) => !v)}
            className="text-xs text-[var(--ink-tertiary)] hover:text-[var(--ink-secondary)] transition-colors flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-[var(--border-subtle)] hover:border-[var(--accent-ember)]"
            aria-label="React to this doodle"
            aria-pressed={pickerOpen}
          >
            <span>{myReaction ? "✎" : "+"}</span>
          </button>

          {pickerOpen && (
            <EmojiPicker
              onSelect={(emoji) => {
                onReact(entry.id, emoji);
                setPickerOpen(false);
              }}
              onClose={() => setPickerOpen(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Canvas ────────────────────────────────────────────────────────────────────
function DoodleCanvas({
  currentRound,
  partnerName,
  onSend,
}: {
  currentRound: number;
  partnerName: string;
  onSend: (dataUrl: string, round: number) => void;
}) {
  const canvasRef          = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes]  = useState<Stroke[]>([]);
  const [color, setColor]      = useState<string>(PALETTE[0]!.hex);
  const [sent, setSent]        = useState(false);
  const isDrawing              = useRef(false);
  const currentStroke          = useRef<{ x: number; y: number }[]>([]);

  // Reset on new round
  useEffect(() => {
    setStrokes([]);
    setSent(false);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
  }, [currentRound]);

  function getPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    const sx = canvasRef.current!.width / rect.width;
    const sy = canvasRef.current!.height / rect.height;
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
  }

  function beginStroke(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    isDrawing.current = true;
    const pos = getPos(e);
    currentStroke.current = [pos];
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(pos.x, pos.y);
    }
  }

  function continueStroke(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing.current) return;
    e.preventDefault();
    const pos = getPos(e);
    currentStroke.current.push(pos);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) { ctx.lineTo(pos.x, pos.y); ctx.stroke(); }
  }

  function endStroke(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing.current) return;
    e.preventDefault();
    isDrawing.current = false;
    if (currentStroke.current.length > 1) {
      setStrokes((prev) => [...prev, { color, points: currentStroke.current }]);
    }
    currentStroke.current = [];
  }

  function redrawAll(strokeList: Stroke[]) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of strokeList) {
      if (s.points.length < 2) continue;
      ctx.beginPath();
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(s.points[0]!.x, s.points[0]!.y);
      for (let i = 1; i < s.points.length; i++) ctx.lineTo(s.points[i]!.x, s.points[i]!.y);
      ctx.stroke();
    }
  }

  function handleUndo() {
    const next = strokes.slice(0, -1);
    setStrokes(next);
    redrawAll(next);
  }

  function handleClear() {
    setStrokes([]);
    redrawAll([]);
  }

  function handleSend() {
    const canvas = canvasRef.current;
    if (!canvas || strokes.length === 0) return;
    const off = document.createElement("canvas");
    off.width = canvas.width;
    off.height = canvas.height;
    const ctx = off.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, off.width, off.height);
    for (const s of strokes) {
      if (s.points.length < 2) continue;
      ctx.beginPath();
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(s.points[0]!.x, s.points[0]!.y);
      for (let i = 1; i < s.points.length; i++) ctx.lineTo(s.points[i]!.x, s.points[i]!.y);
      ctx.stroke();
    }
    const dataUrl = off.toDataURL("image/jpeg", 0.72);
    onSend(dataUrl, currentRound);
    setSent(true);
    // Reset canvas for next doodle
    setTimeout(() => {
      setStrokes([]);
      setSent(false);
      redrawAll([]);
    }, 1200);
  }

  return (
    <div className="flex flex-col border-t border-[var(--border-subtle)]">
      {/* Canvas */}
      <div className="relative bg-white">
        <canvas
          ref={canvasRef}
          width={640}
          height={260}
          className="w-full touch-none cursor-crosshair block"
          onPointerDown={beginStroke}
          onPointerMove={continueStroke}
          onPointerUp={endStroke}
          onPointerLeave={endStroke}
          aria-label="Drawing canvas"
        />
        {strokes.length === 0 && (
          <p className="absolute inset-0 flex items-center justify-center text-xs text-[var(--ink-tertiary)] pointer-events-none select-none">
            Draw something…
          </p>
        )}
      </div>

      {/* Palette + undo/clear */}
      <div className="px-3 py-2 flex items-center gap-2 bg-[var(--bg-base)]">
        <div className="flex gap-1.5" role="group" aria-label="Color">
          {PALETTE.map((s) => (
            <button
              key={s.label}
              onClick={() => setColor(s.hex)}
              aria-label={s.label}
              aria-pressed={color === s.hex}
              className="rounded-full border-2 transition-transform"
              style={{
                width: 22, height: 22,
                background: s.hex,
                borderColor: color === s.hex ? "var(--ink-primary)" : "transparent",
                transform: color === s.hex ? "scale(1.2)" : "scale(1)",
              }}
            />
          ))}
        </div>
        <div className="ml-auto flex gap-3">
          <button
            onClick={handleUndo}
            disabled={strokes.length === 0}
            className="text-xs text-[var(--ink-tertiary)] disabled:opacity-30 hover:text-[var(--ink-secondary)]"
          >
            Undo
          </button>
          <button
            onClick={handleClear}
            disabled={strokes.length === 0}
            className="text-xs text-[var(--ink-tertiary)] disabled:opacity-30 hover:text-[var(--ink-secondary)]"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Send button */}
      <div className="px-3 pb-3">
        <button
          onClick={handleSend}
          disabled={strokes.length === 0 || sent}
          className={`w-full py-2.5 rounded-[var(--radius-md)] font-semibold text-sm transition-all
            ${strokes.length > 0 && !sent
              ? "bg-[var(--accent-ember)] text-white hover:opacity-90 active:scale-95"
              : "bg-[var(--bg-sunken)] text-[var(--ink-tertiary)] cursor-not-allowed"
            }`}
        >
          {sent ? "Sent ✓" : `Send to ${partnerName}`}
        </button>
      </div>
    </div>
  );
}

// ── Main Panel ────────────────────────────────────────────────────────────────
export function DoodlePanel({
  isOpen,
  onClose,
  isWaiting,
  currentRound,
  gallery,
  myPlayerId,
  partnerName,
  partnerAvatarId,
  myAvatarId,
  onSendDoodle,
  onReact,
}: DoodlePanelProps) {
  const reduced   = useReducedMotion();
  const feedRef   = useRef<HTMLDivElement>(null);

  // Auto-scroll feed to bottom when new entries arrive
  useEffect(() => {
    if (isOpen && feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [gallery.length, isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: "100%" }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={reduced   ? { opacity: 0 } : { opacity: 0, y: "100%" }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/35 backdrop-blur-[2px] pointer-events-auto"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Doodle Gallery"
            className="relative pointer-events-auto w-full max-w-md bg-[var(--bg-elevated)] rounded-t-[var(--radius-lg)] sm:rounded-[var(--radius-lg)] shadow-[var(--shadow-xl)] flex flex-col overflow-hidden"
            style={{ maxHeight: "90dvh" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-[var(--border-subtle)] shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-[var(--ink-primary)]">
                  Doodles
                </span>
                {gallery.length > 0 && (
                  <span className="text-xs bg-[var(--accent-ember)] text-white rounded-full px-1.5 py-0.5 font-bold tabular-nums">
                    {gallery.length}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-[var(--bg-sunken)] text-[var(--ink-tertiary)] hover:text-[var(--ink-primary)] transition-colors"
                aria-label="Close doodle panel"
              >
                ✕
              </button>
            </div>

            {/* Gallery feed — scrollable */}
            <div
              ref={feedRef}
              className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5 min-h-0"
              style={{ overscrollBehavior: "contain" }}
            >
              {gallery.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center py-8">
                  <span className="text-3xl" aria-hidden="true">🖊️</span>
                  <p className="text-sm text-[var(--ink-secondary)]">
                    {isWaiting
                      ? "Draw something below while you wait!"
                      : `Waiting for ${partnerName} to doodle…`}
                  </p>
                </div>
              ) : (
                gallery.map((entry) => (
                  <DoodleFeedItem
                    key={entry.id}
                    entry={entry}
                    isOwn={entry.senderPlayerId === myPlayerId}
                    myPlayerId={myPlayerId}
                    onReact={onReact}
                  />
                ))
              )}
            </div>

            {/* Canvas — waiting player only */}
            {isWaiting && (
              <DoodleCanvas
                currentRound={currentRound}
                partnerName={partnerName}
                onSend={onSendDoodle}
              />
            )}

            {/* Non-waiting view-only footer */}
            {!isWaiting && (
              <div className="px-4 py-3 border-t border-[var(--border-subtle)] shrink-0">
                <p className="text-xs text-center text-[var(--ink-tertiary)]">
                  Answer your question first — then you can doodle too.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
