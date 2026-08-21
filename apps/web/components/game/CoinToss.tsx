"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence, useAnimationControls } from "framer-motion";
import type { PlayerState } from "@twilight/shared-types";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { useReducedMotion } from "@/lib/a11y/useReducedMotion";

interface CoinTossProps {
  player1: PlayerState;
  player2: PlayerState;
  winnerId: string;
  isTosser: boolean;
  phase: "coin_toss_waiting" | "coin_toss_flipping";
  onFlip?: () => void;
}

type Stage = "intro" | "spinning" | "result";

// Particle burst on landing
function LandingParticles({ active, accentColor }: { active: boolean; accentColor: string }) {
  if (!active) return null;
  const count = 10;
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * 360;
        const dist  = 60 + (i % 3) * 18;
        const x = Math.cos((angle * Math.PI) / 180) * dist;
        const y = Math.sin((angle * Math.PI) / 180) * dist;
        return (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
            animate={{ x, y, opacity: [1, 0.8, 0], scale: [0, 1.2, 0] }}
            transition={{ duration: 0.9, delay: (i % 4) * 0.04, ease: "easeOut" }}
            className="absolute left-1/2 top-1/2 rounded-full -translate-x-1/2 -translate-y-1/2"
            style={{
              width: 5 + (i % 3) * 2,
              height: 5 + (i % 3) * 2,
              background: i % 2 === 0 ? accentColor : "var(--cat-playful)",
            }}
          />
        );
      })}
    </div>
  );
}

export function CoinToss({ player1, player2, winnerId, isTosser, phase, onFlip }: CoinTossProps) {
  const reduced = useReducedMotion();
  const [stage, setStage] = useState<Stage>("intro");
  const coinControls = useAnimationControls();

  const resolvedWinnerId = winnerId || player1.id;
  const isWinnerP1 = resolvedWinnerId === player1.id;
  const winner = isWinnerP1 ? player1 : player2;
  const loser  = isWinnerP1 ? player2 : player1;

  // Ember warm tone for P1 face, dusk-blue for P2 face
  const P1_FACE_BG = "linear-gradient(145deg, hsl(18 76% 56%), hsl(18 76% 44%))";
  const P2_FACE_BG = "linear-gradient(145deg, hsl(250 40% 42%), hsl(250 40% 28%))";
  const P1_BORDER  = "var(--accent-ember)";
  const P2_BORDER  = "hsl(250 40% 55%)";
  const ACCENT     = "var(--accent-ember)";

  // Landing glow: winner side
  const winnerGlow = isWinnerP1
    ? "0 0 28px hsl(18 76% 52% / 0.6), 0 0 60px hsl(18 76% 52% / 0.25)"
    : "0 0 28px hsl(250 40% 55% / 0.6), 0 0 60px hsl(250 40% 55% / 0.25)";

  // The number of full face-alternations visible determines how "many flips" it looks like.
  // Final rotateY: P1 wins → end on front face (even multiple of 360); P2 wins → end on back (+ 180)
  const baseRotations = 6; // ~6 full turns
  const finalRotY     = isWinnerP1 ? baseRotations * 360 : baseRotations * 360 + 180;
  // Overshoot: go 8° past, then back
  const overshoot     = 8;

  const runFlipAnimation = useCallback(async () => {
    if (reduced) {
      // Reduced motion: skip to result
      await coinControls.set({ rotateY: finalRotY, y: 0, scale: 1 });
      setStage("result");
      return;
    }

    setStage("spinning");

    // 3-keyframe animation:
    // 1. Rise + fast spin start
    // 2. Overshoot past final angle
    // 3. Settle at final
    await coinControls.start({
      rotateY: [0, finalRotY + overshoot, finalRotY],
      y: [0, -100, -100, 0],
      scale: [1, 1.1, 1.1, 1.0],
    }, {
      duration: 2.8,
      ease: [0.16, 1, 0.3, 1], // EASE_OUT — decelerates naturally
      times: [0, 0.38, 0.78, 1],
    });

    setStage("result");

    // Haptic on landing
    try { if ("vibrate" in navigator) navigator.vibrate(15); } catch { /* no-op */ }
  }, [coinControls, finalRotY, reduced]);

  useEffect(() => {
    if (phase === "coin_toss_flipping") {
      runFlipAnimation();
    }
  }, [phase, runFlipAnimation]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 text-center px-4">

      {/* ── Header copy ────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {stage === "intro" && (
          <motion.div
            key="intro-hdr"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center gap-2"
          >
            <span className="category-label text-[var(--accent-ember)] font-semibold tracking-widest text-xs uppercase">
              ✦ Coin Toss ✦
            </span>
            <h2 className="font-display text-3xl sm:text-4xl text-ink-primary font-serif">
              Toss time.
            </h2>
            <div className="mt-4 h-12 flex items-center justify-center">
              {isTosser ? (
                /* Breathing Flip Coin button */
                <motion.button
                  onClick={onFlip}
                  animate={reduced ? {} : { scale: [1, 1.04, 1] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  className="px-7 py-2.5 bg-[var(--accent-ember)] text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center gap-2 cursor-pointer"
                  id="flip-coin-btn"
                >
                  <span>Flip</span>
                </motion.button>
              ) : (
                <p className="text-sm text-ink-tertiary animate-pulse">
                  Waiting for {player1.displayName} to flip…
                </p>
              )}
            </div>
          </motion.div>
        )}

        {stage === "spinning" && (
          <motion.div
            key="spinning-hdr"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <p className="text-sm text-ink-tertiary tracking-widest animate-pulse font-mono">
              Tossing…
            </p>
          </motion.div>
        )}

        {stage === "result" && (
          <motion.div
            key="result-hdr"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center gap-1"
          >
            <span className="category-label text-[var(--accent-ember)] font-semibold tracking-widest text-xs uppercase">
              ✦ Result ✦
            </span>
            <h2 className="font-display text-3xl sm:text-4xl text-ink-primary font-serif">
              {winner.displayName} goes first.
            </h2>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Player name labels ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-8 text-sm">
        <motion.div
          animate={
            stage === "result"
              ? { scale: isWinnerP1 ? 1.08 : 1, color: isWinnerP1 ? "var(--accent-ember)" : "var(--ink-tertiary)" }
              : { scale: 1, color: "var(--ink-secondary)" }
          }
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center gap-1.5"
        >
          <PlayerAvatar avatar={player1.avatar} name={player1.displayName} size="sm" />
          <span className="font-medium">{player1.displayName}</span>
        </motion.div>

        <span className="text-ink-tertiary font-mono text-xs">VS</span>

        <motion.div
          animate={
            stage === "result"
              ? { scale: !isWinnerP1 ? 1.08 : 1, color: !isWinnerP1 ? "var(--accent-ember)" : "var(--ink-tertiary)" }
              : { scale: 1, color: "var(--ink-secondary)" }
          }
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center gap-1.5"
        >
          <PlayerAvatar avatar={player2.avatar} name={player2.displayName} size="sm" />
          <span className="font-medium">{player2.displayName}</span>
        </motion.div>
      </div>

      {/* ── The Twilight Coin ──────────────────────────────────────────────── */}
      <div
        className="relative flex items-center justify-center"
        style={{ perspective: "1200px", width: 160, height: 180 }}
      >
        {/* Landing particles */}
        <LandingParticles active={stage === "result"} accentColor="hsl(18 76% 52%)" />

        {/* Floor shadow */}
        <motion.div
          animate={
            stage === "spinning"
              ? { scale: [1, 0.3, 0.3, 1.1, 1], opacity: [0.3, 0.07, 0.07, 0.4, 0.3] }
              : { scale: 1, opacity: 0.3 }
          }
          transition={{ duration: stage === "spinning" ? 2.8 : 0.5, ease: "easeInOut" }}
          className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-5 rounded-full bg-black/15 blur-lg pointer-events-none"
        />

        {/* Landing glow bloom */}
        <AnimatePresence>
          {stage === "result" && !reduced && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: [0, 0.4, 0], scale: [0.85, 1.3, 1.0] }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{ background: isWinnerP1 ? "hsl(18 76% 52%)" : "hsl(250 40% 55%)" }}
              aria-hidden="true"
            />
          )}
        </AnimatePresence>

        {/* The Coin */}
        <motion.div
          animate={coinControls}
          initial={{ rotateY: 0, y: 0, scale: 1 }}
          className="relative rounded-full cursor-default"
          style={{ width: 140, height: 140, transformStyle: "preserve-3d" }}
        >
          {/* Coin edge (thickness illusion) */}
          <div
            className="absolute inset-[3px] rounded-full"
            style={{
              transform: "translateZ(-4px)",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              background: "linear-gradient(135deg, #8a6b1e, #c49a2a, #8a6b1e)",
              boxShadow: "inset 0 0 12px rgba(0,0,0,0.3)",
            }}
          />

          {/* Face A: Player 1 — warm ember */}
          <div
            className="absolute inset-0 rounded-full flex flex-col items-center justify-center"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "translateZ(1px)",
              background: P1_FACE_BG,
              border: `3px solid ${P1_BORDER}`,
              boxShadow: stage === "result" && isWinnerP1 ? winnerGlow : "0 4px 20px rgba(0,0,0,0.2)",
            }}
          >
            <PlayerAvatar avatar={player1.avatar} name={player1.displayName} size="md" />
            <span className="font-bold text-[10px] text-white mt-1 truncate max-w-[90px]">
              {player1.displayName}
            </span>
          </div>

          {/* Face B: Player 2 — dusk blue */}
          <div
            className="absolute inset-0 rounded-full flex flex-col items-center justify-center"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg) translateZ(1px)",
              background: P2_FACE_BG,
              border: `3px solid ${P2_BORDER}`,
              boxShadow: stage === "result" && !isWinnerP1 ? winnerGlow : "0 4px 20px rgba(0,0,0,0.2)",
            }}
          >
            <PlayerAvatar avatar={player2.avatar} name={player2.displayName} size="md" />
            <span className="font-bold text-[10px] text-[#F3EEE6] mt-1 truncate max-w-[90px]">
              {player2.displayName}
            </span>
          </div>
        </motion.div>
      </div>

      {/* ── Result banner ─────────────────────────────────────────────────── */}
      <div className="h-16 flex items-center justify-center">
        <AnimatePresence>
          {stage === "result" && (
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-sm text-ink-secondary max-w-[280px]"
            >
              They choose the first mood for{" "}
              <strong className="text-ink-primary">{loser.displayName}</strong> to answer.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
