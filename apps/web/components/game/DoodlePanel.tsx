"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  DOODLE_REACTION_EMOJIS,
  type DoodleEntry,
  type DoodleSendResult,
} from "@twilight/shared-types";
import { EmojiPicker } from "@/components/ui/EmojiPicker";
import { useReducedMotion } from "@/lib/a11y/useReducedMotion";

const CANVAS_WIDTH = 840;
const CANVAS_HEIGHT = 480;
const MAX_DATA_URL_LENGTH = 76_000;

const PALETTE = [
  { label: "Ink", hex: "#2A2622" },
  { label: "Ember", hex: "#E1592A" },
  { label: "Deep", hex: "#5B6FA8" },
  { label: "Gold", hex: "#C88D1A" },
  { label: "Rose", hex: "#C26B6B" },
] as const;

const BRUSHES = [
  { label: "Fine", width: 3 },
  { label: "Medium", width: 7 },
  { label: "Bold", width: 13 },
] as const;

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  color: string;
  width: number;
  points: Point[];
}

interface DoodlePanelProps {
  isOpen: boolean;
  onClose: () => void;
  /** Only the waiting (non-answering) player can draw and send. */
  isWaiting: boolean;
  currentRound: number;
  gallery: DoodleEntry[];
  myPlayerId: string;
  partnerName: string;
  onSendDoodle: (
    dataUrl: string,
    round: number,
    clientId: string,
    onResult: (result: DoodleSendResult) => void,
  ) => boolean;
  onReact: (doodleId: string, emoji: string) => void;
}

function createDoodleClientId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `doodle_${crypto.randomUUID().replaceAll("-", "")}`;
  }
  const randomPart = Math.random().toString(36).slice(2);
  return `doodle_${Date.now().toString(36)}_${randomPart}`;
}

function drawStroke(context: CanvasRenderingContext2D, stroke: Stroke): void {
  const [firstPoint] = stroke.points;
  if (!firstPoint) return;

  context.fillStyle = stroke.color;
  context.strokeStyle = stroke.color;
  context.lineWidth = stroke.width;
  context.lineCap = "round";
  context.lineJoin = "round";

  if (stroke.points.length === 1) {
    context.beginPath();
    context.arc(firstPoint.x, firstPoint.y, stroke.width / 2, 0, Math.PI * 2);
    context.fill();
    return;
  }

  context.beginPath();
  context.moveTo(firstPoint.x, firstPoint.y);
  for (let index = 1; index < stroke.points.length; index += 1) {
    const point = stroke.points[index]!;
    context.lineTo(point.x, point.y);
  }
  context.stroke();
}

function encodeDoodle(strokes: readonly Stroke[]): string | null {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) return null;

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  strokes.forEach((stroke) => drawStroke(context, stroke));

  for (const quality of [0.78, 0.68, 0.58, 0.48]) {
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    if (dataUrl.length <= MAX_DATA_URL_LENGTH) return dataUrl;
  }

  // A smaller export keeps detailed doodles under the server's strict limit.
  const compact = document.createElement("canvas");
  compact.width = 630;
  compact.height = 360;
  const compactContext = compact.getContext("2d");
  if (!compactContext) return null;
  compactContext.fillStyle = "#ffffff";
  compactContext.fillRect(0, 0, compact.width, compact.height);
  compactContext.drawImage(canvas, 0, 0, compact.width, compact.height);

  for (const quality of [0.68, 0.56, 0.44]) {
    const dataUrl = compact.toDataURL("image/jpeg", quality);
    if (dataUrl.length <= MAX_DATA_URL_LENGTH) return dataUrl;
  }
  return null;
}

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
    .filter(([playerId]) => playerId !== myPlayerId)
    .map(([, emoji]) => emoji);

  return (
    <article className={`flex flex-col gap-2 ${isOwn ? "items-end" : "items-start"}`}>
      <span className="px-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--ink-tertiary)]">
        {isOwn ? "You" : entry.senderName} · Round {entry.round}
      </span>

      <div
        className={`relative max-w-[92%] overflow-hidden rounded-[var(--radius-md)] border bg-white ${
          isOwn
            ? "rounded-tr-sm border-[var(--accent-ember)]/40"
            : "rounded-tl-sm border-[var(--border-subtle)]"
        }`}
        style={{ boxShadow: "var(--shadow-sm)" }}
      >
        <Image
          src={entry.dataUrl}
          alt={`Doodle from ${entry.senderName}`}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          unoptimized
          className="block h-auto max-h-60 w-full object-contain"
        />
      </div>

      <div className="relative flex min-h-10 items-center gap-1.5 px-1">
        {partnerReactions.map((emoji, index) => (
          <span key={`${emoji}-${index}`} className="text-lg" aria-label={`${entry.senderName} reacted ${emoji}`}>
            {emoji}
          </span>
        ))}
        {myReaction && <span className="text-lg" aria-label={`You reacted ${myReaction}`}>{myReaction}</span>}

        <div className="relative">
          <button
            type="button"
            onClick={() => setPickerOpen((open) => !open)}
            className="flex min-h-10 min-w-10 items-center justify-center rounded-full border border-[var(--border-subtle)] px-2 text-sm text-[var(--ink-tertiary)] transition-colors hover:border-[var(--accent-ember)] hover:text-[var(--ink-secondary)]"
            aria-label="React to this doodle"
            aria-pressed={pickerOpen}
          >
            {myReaction ? "✎" : "+"}
          </button>
          {pickerOpen && (
            <EmojiPicker
              emojis={DOODLE_REACTION_EMOJIS}
              align="end"
              onSelect={(emoji) => {
                onReact(entry.id, emoji);
                setPickerOpen(false);
              }}
              onClose={() => setPickerOpen(false)}
            />
          )}
        </div>
      </div>
    </article>
  );
}

function DoodleCanvas({
  currentRound,
  partnerName,
  gallery,
  onSend,
}: {
  currentRound: number;
  partnerName: string;
  gallery: readonly DoodleEntry[];
  onSend: DoodlePanelProps["onSendDoodle"];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activePointerId = useRef<number | null>(null);
  const activeStroke = useRef<Stroke | null>(null);
  const pendingClientId = useRef<string | null>(null);
  const sendTimeout = useRef<number | null>(null);
  const isMounted = useRef(true);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [color, setColor] = useState<string>(PALETTE[0].hex);
  const [brushWidth, setBrushWidth] = useState<number>(BRUSHES[1].width);
  const [sendState, setSendState] = useState<"idle" | "sending" | "error">("idle");
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (sendTimeout.current) window.clearTimeout(sendTimeout.current);
    };
  }, []);

  // The broadcast itself is also proof of delivery. This recovers cleanly if
  // a Socket.IO acknowledgement gets lost after the server has stored it.
  useEffect(() => {
    const clientId = pendingClientId.current;
    if (!clientId || !gallery.some((entry) => entry.id === clientId)) return;
    if (sendTimeout.current) window.clearTimeout(sendTimeout.current);
    sendTimeout.current = null;
    pendingClientId.current = null;
    const canvas = canvasRef.current;
    canvas?.getContext("2d")?.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    setStrokes([]);
    setSendError(null);
    setSendState("idle");
  }, [gallery]);

  function redraw(strokeList: readonly Stroke[]): void {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    strokeList.forEach((stroke) => drawStroke(context, stroke));
  }

  function positionFor(event: PointerEvent<HTMLCanvasElement>): Point | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return null;
    return {
      x: Math.max(0, Math.min(canvas.width, ((event.clientX - bounds.left) / bounds.width) * canvas.width)),
      y: Math.max(0, Math.min(canvas.height, ((event.clientY - bounds.top) / bounds.height) * canvas.height)),
    };
  }

  function beginStroke(event: PointerEvent<HTMLCanvasElement>): void {
    if (sendState === "sending") return;
    const point = positionFor(event);
    if (!point) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    activePointerId.current = event.pointerId;
    activeStroke.current = { color, width: brushWidth, points: [point] };
    const context = canvasRef.current?.getContext("2d");
    if (context) drawStroke(context, activeStroke.current);
  }

  function continueStroke(event: PointerEvent<HTMLCanvasElement>): void {
    if (activePointerId.current !== event.pointerId || !activeStroke.current) return;
    const point = positionFor(event);
    if (!point) return;
    event.preventDefault();
    const stroke = activeStroke.current;
    stroke.points.push(point);
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;
    context.strokeStyle = stroke.color;
    context.lineWidth = stroke.width;
    context.lineCap = "round";
    context.lineJoin = "round";
    const previous = stroke.points[stroke.points.length - 2]!;
    context.beginPath();
    context.moveTo(previous.x, previous.y);
    context.lineTo(point.x, point.y);
    context.stroke();
  }

  function finishStroke(event: PointerEvent<HTMLCanvasElement>): void {
    if (activePointerId.current !== event.pointerId || !activeStroke.current) return;
    event.preventDefault();
    const stroke = activeStroke.current;
    activePointerId.current = null;
    activeStroke.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setStrokes((existing) => [...existing, stroke]);
  }

  function undo(): void {
    if (sendState === "sending") return;
    const next = strokes.slice(0, -1);
    setStrokes(next);
    redraw(next);
    setSendError(null);
    setSendState("idle");
  }

  function clear(): void {
    if (sendState === "sending") return;
    setStrokes([]);
    redraw([]);
    setSendError(null);
    setSendState("idle");
  }

  function handleSendResult(clientId: string, result: DoodleSendResult): void {
    if (!isMounted.current || pendingClientId.current !== clientId) return;
    if (sendTimeout.current) window.clearTimeout(sendTimeout.current);
    sendTimeout.current = null;

    if (result.ok) {
      pendingClientId.current = null;
      setStrokes([]);
      redraw([]);
      setSendError(null);
      setSendState("idle");
      return;
    }

    setSendError(result.reason ?? "Your doodle could not be sent. Try again when you are ready.");
    setSendState("error");
  }

  function send(): void {
    if (strokes.length === 0 || sendState === "sending") return;
    const dataUrl = encodeDoodle(strokes);
    if (!dataUrl) {
      setSendError("This doodle is too detailed to send. Try a simpler sketch or clear part of it.");
      setSendState("error");
      return;
    }

    const clientId = pendingClientId.current ?? createDoodleClientId();
    pendingClientId.current = clientId;
    setSendError(null);
    setSendState("sending");
    const started = onSend(dataUrl, currentRound, clientId, (result) => handleSendResult(clientId, result));
    if (!started || pendingClientId.current !== clientId) return;

    if (sendTimeout.current) window.clearTimeout(sendTimeout.current);
    sendTimeout.current = window.setTimeout(() => {
      if (pendingClientId.current !== clientId) return;
      setSendError("Still waiting for the server. Your sketch is safe here — tap Send again to retry.");
      setSendState("error");
    }, 12_000);
  }

  const hasStrokes = strokes.length > 0;
  const isSending = sendState === "sending";

  return (
    <section className="shrink-0 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)]" aria-label="Doodle canvas">
      <div className="relative bg-white">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className={`block w-full touch-none ${isSending ? "cursor-wait opacity-80" : "cursor-crosshair"}`}
          style={{ aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}` }}
          onPointerDown={beginStroke}
          onPointerMove={continueStroke}
          onPointerUp={finishStroke}
          onPointerCancel={finishStroke}
          onLostPointerCapture={finishStroke}
          aria-label="Drawing canvas"
          aria-describedby="doodle-canvas-help"
        />
        {!hasStrokes && !isSending && (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center px-8 text-center text-sm text-[var(--ink-tertiary)] select-none">
            Draw a small note, a tiny scene, or whatever comes to mind.
          </p>
        )}
      </div>
      <p id="doodle-canvas-help" className="sr-only">
        Draw with a mouse, trackpad, stylus, or finger. Choose a color and brush size below.
      </p>

      <div className="flex flex-col gap-3 border-t border-[var(--border-subtle)] px-3 py-3 sm:px-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2" role="group" aria-label="Doodle color">
            <span className="text-xs font-medium text-[var(--ink-tertiary)]">Color</span>
            <div className="flex gap-1">
              {PALETTE.map((swatch) => (
                <button
                  key={swatch.label}
                  type="button"
                  onClick={() => setColor(swatch.hex)}
                  disabled={isSending}
                  aria-label={swatch.label}
                  aria-pressed={color === swatch.hex}
                  className="flex h-9 w-9 items-center justify-center rounded-full border-2 transition-transform disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    background: swatch.hex,
                    borderColor: color === swatch.hex ? "var(--ink-primary)" : "transparent",
                    transform: color === swatch.hex ? "scale(1.08)" : "scale(1)",
                  }}
                >
                  <span className="sr-only">{swatch.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1" role="group" aria-label="Brush size">
            {BRUSHES.map((brush) => (
              <button
                key={brush.label}
                type="button"
                onClick={() => setBrushWidth(brush.width)}
                disabled={isSending}
                aria-label={`${brush.label} brush`}
                aria-pressed={brushWidth === brush.width}
                className={`flex h-9 min-w-9 items-center justify-center rounded-full border px-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  brushWidth === brush.width
                    ? "border-[var(--accent-ember)] bg-[var(--accent-ember-tint)] text-[var(--accent-ember)]"
                    : "border-[var(--border-subtle)] text-[var(--ink-tertiary)] hover:text-[var(--ink-secondary)]"
                }`}
              >
                <span className="sr-only">{brush.label}</span>
                <span className="rounded-full bg-current" style={{ width: brush.width + 2, height: brush.width + 2 }} />
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={undo}
              disabled={!hasStrokes || isSending}
              className="min-h-10 rounded-[var(--radius-sm)] px-3 text-sm text-[var(--ink-tertiary)] transition-colors hover:bg-[var(--bg-sunken)] hover:text-[var(--ink-secondary)] disabled:cursor-not-allowed disabled:opacity-35"
            >
              Undo
            </button>
            <button
              type="button"
              onClick={clear}
              disabled={!hasStrokes || isSending}
              className="min-h-10 rounded-[var(--radius-sm)] px-3 text-sm text-[var(--ink-tertiary)] transition-colors hover:bg-[var(--bg-sunken)] hover:text-[var(--ink-secondary)] disabled:cursor-not-allowed disabled:opacity-35"
            >
              Clear
            </button>
          </div>
          <span className="text-xs text-[var(--ink-tertiary)]" aria-live="polite">
            {hasStrokes ? `${strokes.length} ${strokes.length === 1 ? "stroke" : "strokes"}` : ""}
          </span>
        </div>

        {sendError && (
          <p className="rounded-[var(--radius-sm)] bg-[var(--accent-ember-tint)] px-3 py-2 text-xs leading-5 text-[var(--ink-secondary)]" role="alert">
            {sendError}
          </p>
        )}

        <button
          type="button"
          onClick={send}
          disabled={!hasStrokes || isSending}
          aria-busy={isSending}
          className={`min-h-12 w-full rounded-[var(--radius-md)] px-4 py-3 text-sm font-semibold transition-all ${
            hasStrokes && !isSending
              ? "bg-[var(--accent-ember)] text-white hover:opacity-90 active:scale-[0.99]"
              : "cursor-not-allowed bg-[var(--bg-sunken)] text-[var(--ink-tertiary)]"
          }`}
        >
          {isSending ? "Sending your doodle…" : sendState === "error" ? "Try sending again" : `Send to ${partnerName}`}
        </button>
      </div>
    </section>
  );
}

export function DoodlePanel({
  isOpen,
  onClose,
  isWaiting,
  currentRound,
  gallery,
  myPlayerId,
  partnerName,
  onSendDoodle,
  onReact,
}: DoodlePanelProps) {
  const reduced = useReducedMotion();
  const dialogRef = useRef<HTMLElement>(null);
  const panelCloseButton = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const feedRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const originalOverflow = document.body.style.overflow;
    const focusTimer = window.setTimeout(() => panelCloseButton.current?.focus(), 0);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previousFocus.current?.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) shouldAutoScroll.current = true;
  }, [isOpen]);

  useEffect(() => {
    const feed = feedRef.current;
    if (!isOpen || !feed || !shouldAutoScroll.current) return;
    feed.scrollTop = feed.scrollHeight;
  }, [gallery.length, isOpen]);

  function handleFeedScroll(): void {
    const feed = feedRef.current;
    if (!feed) return;
    shouldAutoScroll.current = feed.scrollHeight - feed.clientHeight - feed.scrollTop < 48;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: "100%" }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: "100%" }}
          transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none sm:items-stretch sm:justify-end sm:p-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/35 backdrop-blur-[2px] pointer-events-auto"
            onClick={onClose}
            aria-hidden="true"
          />

          <section
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="doodle-panel-title"
            className="relative flex max-h-[92dvh] w-full max-w-[32rem] flex-col overflow-hidden rounded-t-[var(--radius-lg)] bg-[var(--bg-elevated)] shadow-[var(--shadow-xl)] pointer-events-auto sm:max-h-none sm:rounded-[var(--radius-lg)]"
          >
            <header className="flex shrink-0 items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3 sm:px-5">
              <div className="flex items-center gap-2">
                <h2 id="doodle-panel-title" className="text-base font-semibold text-[var(--ink-primary)]">Doodles</h2>
                {gallery.length > 0 && (
                  <span className="rounded-full bg-[var(--accent-ember)] px-1.5 py-0.5 text-xs font-bold tabular-nums text-white">
                    {gallery.length}
                  </span>
                )}
              </div>
              <button
                ref={panelCloseButton}
                type="button"
                onClick={onClose}
                className="flex h-11 w-11 items-center justify-center rounded-full text-lg text-[var(--ink-tertiary)] transition-colors hover:bg-[var(--bg-sunken)] hover:text-[var(--ink-primary)]"
                aria-label="Close doodle panel"
              >
                ×
              </button>
            </header>

            <div
              ref={feedRef}
              onScroll={handleFeedScroll}
              className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 py-4 sm:px-5"
              style={{ overscrollBehavior: "contain" }}
            >
              {gallery.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
                  <span className="text-3xl" aria-hidden="true">🖊️</span>
                  <p className="max-w-xs text-sm leading-6 text-[var(--ink-secondary)]">
                    {isWaiting
                      ? "Make a small doodle while your partner answers. It appears for both of you as soon as it sends."
                      : `Waiting for ${partnerName} to leave a small doodle…`}
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

            {isWaiting ? (
              <DoodleCanvas
                key={currentRound}
                currentRound={currentRound}
                partnerName={partnerName}
                gallery={gallery}
                onSend={onSendDoodle}
              />
            ) : (
              <footer className="shrink-0 border-t border-[var(--border-subtle)] px-4 py-3 sm:px-5">
                <p className="text-center text-xs leading-5 text-[var(--ink-tertiary)]">
                  Answer your question first — then it will be your turn to doodle.
                </p>
              </footer>
            )}
          </section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
