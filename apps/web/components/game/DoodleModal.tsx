"use client";

/**
 * DoodleModal — freehand canvas doodle feature for the waiting player.
 *
 * Privacy model (mirrors lock-then-share):
 *  - Nothing is transmitted during drawing.
 *  - On "Send to {name}", emits doodle:send once.
 *  - The active player sees NOTHING until the Reveal screen.
 *
 * Delivery at Reveal is handled server-side: the doodle:send payload is
 * stored in Redis and attached to turn:answer_shared at the Reveal moment.
 */

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getSocket } from "@/lib/socket/client";
import { useReducedMotion } from "@/lib/a11y/useReducedMotion";

// 5 brand swatches — no RGB picker, deliberate constraint
const PALETTE = [
  { label: "Ink",       value: "var(--ink-primary)",      hex: "#2A2622" },
  { label: "Ember",     value: "var(--accent-ember)",     hex: "#E1592A" },
  { label: "Deep",      value: "var(--cat-deep)",         hex: "#5B6FA8" },
  { label: "Curious",   value: "var(--cat-curious)",      hex: "#C88D1A" },
  { label: "Emotional", value: "var(--cat-emotional)",    hex: "#C26B6B" },
] as const;

interface Stroke {
  color: string;
  points: { x: number; y: number }[];
}

interface DoodleModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerName: string;
  currentRound: number;
}

export function DoodleModal({ isOpen, onClose, partnerName, currentRound }: DoodleModalProps) {
  const reduced  = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes]         = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[] | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>(PALETTE[0]!.hex);
  const [sent, setSent]               = useState(false);
  const isDrawing = useRef(false);

  // Reset when modal opens/round changes
  useEffect(() => {
    if (isOpen) {
      setStrokes([]);
      setCurrentStroke(null);
      setSent(false);
      isDrawing.current = false;
    }
  }, [isOpen, currentRound]);

  // Redraw all strokes whenever strokes array changes
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const stroke of strokes) {
      if (stroke.points.length < 2) continue;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth   = 2.5;
      ctx.lineCap     = "round";
      ctx.lineJoin    = "round";
      ctx.moveTo(stroke.points[0]!.x, stroke.points[0]!.y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i]!.x, stroke.points[i]!.y);
      }
      ctx.stroke();
    }
  }, [strokes]);

  useEffect(() => { redrawCanvas(); }, [redrawCanvas]);

  function getPointerPos(e: React.PointerEvent<HTMLCanvasElement>): { x: number; y: number } {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = canvasRef.current!.width / rect.width;
    const scaleY = canvasRef.current!.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top)  * scaleY,
    };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    isDrawing.current = true;
    const pos = getPointerPos(e);
    setCurrentStroke([pos]);
    // Start drawing on canvas live
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth   = 2.5;
      ctx.lineCap     = "round";
      ctx.lineJoin    = "round";
      ctx.moveTo(pos.x, pos.y);
    }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing.current || !currentStroke) return;
    e.preventDefault();
    const pos = getPointerPos(e);
    setCurrentStroke((prev) => [...(prev ?? []), pos]);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
  }

  function handlePointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing.current || !currentStroke) return;
    e.preventDefault();
    isDrawing.current = false;
    if (currentStroke.length > 1) {
      setStrokes((prev) => [...prev, { color: selectedColor, points: currentStroke }]);
    }
    setCurrentStroke(null);
  }

  function handleUndo() {
    setStrokes((prev) => prev.slice(0, -1));
  }

  function handleClear() {
    setStrokes([]);
  }

  function handleSend() {
    const canvas = canvasRef.current;
    if (!canvas || strokes.length === 0) return;
    // Render white background + strokes to a JPEG for smaller payload
    const offscreen = document.createElement("canvas");
    offscreen.width  = canvas.width;
    offscreen.height = canvas.height;
    const ctx = offscreen.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, offscreen.width, offscreen.height);
    // Redraw strokes on offscreen
    for (const stroke of strokes) {
      if (stroke.points.length < 2) continue;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth   = 2.5;
      ctx.lineCap     = "round";
      ctx.lineJoin    = "round";
      ctx.moveTo(stroke.points[0]!.x, stroke.points[0]!.y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i]!.x, stroke.points[i]!.y);
      }
      ctx.stroke();
    }
    const dataUrl = offscreen.toDataURL("image/jpeg", 0.7);
    getSocket().emit("doodle:send", { dataUrl, round: currentRound });
    setSent(true);
    // Auto-close after a beat
    setTimeout(() => onClose(), 1400);
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: "100%" }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={reduced   ? { opacity: 0 } : { opacity: 0, y: "100%" }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sheet */}
          <div
            className="relative w-full max-w-lg bg-[var(--bg-elevated)] rounded-t-[var(--radius-lg)] sm:rounded-[var(--radius-lg)] shadow-[var(--shadow-xl)] flex flex-col overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Doodle canvas"
          >
            {/* Header */}
            <div className="px-5 pt-5 pb-3 border-b border-[var(--border-subtle)]">
              <h2 className="font-display text-[1.06rem] text-[var(--ink-primary)]">
                Doodle while you wait
              </h2>
              <p className="text-xs text-[var(--ink-tertiary)] mt-0.5">
                Just for you, until you send it
              </p>
            </div>

            {/* Canvas */}
            <div className="relative bg-white border-b border-[var(--border-subtle)]">
              <canvas
                ref={canvasRef}
                width={640}
                height={320}
                className="w-full touch-none cursor-crosshair"
                style={{ display: "block" }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                aria-label="Drawing canvas"
              />
              {strokes.length === 0 && !currentStroke && (
                <p className="absolute inset-0 flex items-center justify-center text-sm text-[var(--ink-tertiary)] pointer-events-none select-none">
                  Draw something…
                </p>
              )}
            </div>

            {/* Palette + tools */}
            <div className="px-4 py-3 flex items-center gap-3 flex-wrap">
              {/* Color swatches */}
              <div className="flex items-center gap-2" role="group" aria-label="Choose color">
                {PALETTE.map((swatch) => (
                  <button
                    key={swatch.label}
                    onClick={() => setSelectedColor(swatch.hex)}
                    aria-label={swatch.label}
                    aria-pressed={selectedColor === swatch.hex}
                    className="rounded-full transition-transform border-2 focus-visible:outline-none"
                    style={{
                      width: 26,
                      height: 26,
                      background: swatch.hex,
                      borderColor: selectedColor === swatch.hex ? "var(--ink-primary)" : "transparent",
                      transform: selectedColor === swatch.hex ? "scale(1.18)" : "scale(1)",
                    }}
                  />
                ))}
              </div>

              <div className="ml-auto flex items-center gap-3">
                <button
                  onClick={handleUndo}
                  disabled={strokes.length === 0}
                  className="text-xs text-[var(--ink-secondary)] disabled:opacity-30 hover:text-[var(--ink-primary)] transition-colors"
                  aria-label="Undo last stroke"
                >
                  Undo
                </button>
                <button
                  onClick={handleClear}
                  disabled={strokes.length === 0}
                  className="text-xs text-[var(--ink-secondary)] disabled:opacity-30 hover:text-[var(--ink-primary)] transition-colors"
                  aria-label="Clear canvas"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Send / close actions */}
            <div className="px-4 pb-5 flex flex-col gap-2">
              <button
                onClick={handleSend}
                disabled={strokes.length === 0 || sent}
                className={`w-full py-3 rounded-[var(--radius-md)] font-semibold text-sm transition-all duration-200
                  ${strokes.length > 0 && !sent
                    ? "bg-[var(--accent-ember)] text-white shadow-sm hover:opacity-90 active:scale-95"
                    : "bg-[var(--bg-sunken)] text-[var(--ink-tertiary)] cursor-not-allowed"
                  }`}
                aria-label={`Send doodle to ${partnerName}`}
              >
                {sent ? "Sent ✓" : `Send to ${partnerName}`}
              </button>
              {!sent && (
                <button
                  onClick={onClose}
                  className="text-xs text-[var(--ink-tertiary)] hover:text-[var(--ink-secondary)] transition-colors text-center py-1"
                >
                  Discard &amp; close
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
