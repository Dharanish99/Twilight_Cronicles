"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence, useAnimationControls } from "framer-motion";
import type { PlayerState } from "@twilight/shared-types";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { useReducedMotion } from "@/lib/a11y/useReducedMotion";
import { EASE_OUT } from "@/lib/theme/motion";

interface CoinTossProps {
  player1: PlayerState;
  player2: PlayerState;
  winnerId: string;
  isTosser: boolean;
  phase: "coin_toss_waiting" | "coin_toss_flipping";
  onFlip?: () => void;
}

type Stage = "intro" | "spinning" | "landing" | "result";

// ── Radial burst particles ────────────────────────────────────────────────────
function BurstParticles({ accentColor }: { accentColor: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {Array.from({ length: 14 }).map((_, i) => {
        const angle = (i / 14) * 360;
        const dist  = 70 + (i % 4) * 16;
        const x = Math.cos((angle * Math.PI) / 180) * dist;
        const y = Math.sin((angle * Math.PI) / 180) * dist;
        const size = 4 + (i % 3) * 2;
        return (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, opacity: 0.9, scale: 0.5 }}
            animate={{ x, y, opacity: 0, scale: 1.3 }}
            transition={{
              duration: 0.65 + (i % 3) * 0.12,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="absolute rounded-full"
            style={{
              left: "50%",
              top: "50%",
              marginLeft: -size / 2,
              marginTop: -size / 2,
              width: size,
              height: size,
              background: i % 2 === 0 ? accentColor : "var(--cat-playful)",
            }}
          />
        );
      })}
    </div>
  );
}

// ── Ambient star field ────────────────────────────────────────────────────────
function StarField({ visible }: { visible: boolean }) {
  const stars = useRef(
    Array.from({ length: 28 }, (_, i) => ({
      id: i,
      x: 5 + Math.abs(Math.sin(i * 137.5) * 90),
      y: 5 + Math.abs(Math.cos(i * 97.3) * 90),
      size: 1.5 + (i % 3) * 0.8,
      delay: (i * 0.18) % 2.4,
      dur: 2.4 + (i % 5) * 0.4,
    }))
  );

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl"
          aria-hidden="true"
        >
          {stars.current.map((s) => (
            <motion.div
              key={s.id}
              className="absolute rounded-full bg-white"
              style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size }}
              animate={{ opacity: [0.08, 0.45, 0.08] }}
              transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function CoinToss({ player1, player2, winnerId, isTosser, phase, onFlip }: CoinTossProps) {
  const reduced       = useReducedMotion();
  const [stage, setStage] = useState<Stage>("intro");
  const coinControls  = useAnimationControls();
  const hasFlipped    = useRef(false);

  const resolvedWinnerId = winnerId || player1.id;
  const isWinnerP1       = resolvedWinnerId === player1.id;
  const winner           = isWinnerP1 ? player1 : player2;
  const loser            = isWinnerP1 ? player2 : player1;

  // Face colours
  const P1_BG    = "linear-gradient(145deg, hsl(18 76% 54%), hsl(18 76% 38%))";
  const P2_BG    = "linear-gradient(145deg, hsl(250 38% 46%), hsl(250 38% 28%))";
  const P1_RING  = "hsl(18 76% 62%)";
  const P2_RING  = "hsl(250 38% 62%)";
  const WINNER_COLOR = isWinnerP1 ? "hsl(18 76% 60%)" : "hsl(250 38% 62%)";
  const WINNER_GLOW  = isWinnerP1
    ? "0 0 32px hsl(18 76% 52% / 0.7), 0 0 80px hsl(18 76% 52% / 0.3)"
    : "0 0 32px hsl(250 38% 56% / 0.7), 0 0 80px hsl(250 38% 56% / 0.3)";

  // Final resting angle: P1 wins → front face (multiple of 360), P2 → back face (+180)
  const FULL_SPINS = 7; // total visual turns
  const finalRotY  = isWinnerP1 ? FULL_SPINS * 360 : FULL_SPINS * 360 + 180;
  const OVERSHOOT  = 10; // degrees

  const runFlip = useCallback(async () => {
    if (hasFlipped.current) return;
    hasFlipped.current = true;

    if (reduced) {
      await coinControls.set({ rotateY: finalRotY, y: 0, scale: 1 });
      setStage("result");
      return;
    }

    setStage("spinning");

    // 1. Launch — coin lifts high, fast spin start (first third)
    await coinControls.start({
      y: -130,
      scale: 1.12,
      rotateY: FULL_SPINS * 180, // halfway through spins at apex
    }, {
      duration: 1.1,
      ease: [0.33, 1, 0.68, 1], // fast out — snappy launch
    });

    // 2. Decelerate arc — slow spin as it falls
    await coinControls.start({
      y: 0,
      scale: 1.0,
      rotateY: finalRotY + OVERSHOOT,
    }, {
      duration: 1.5,
      ease: [0.16, 1, 0.3, 1], // EASE_OUT — organic deceleration
    });

    setStage("landing");

    // 3. Settle wobble — 8° overshoot → land flat
    await coinControls.start({
      rotateY: finalRotY,
    }, {
      duration: 0.28,
      ease: [0.34, 1.56, 0.64, 1], // spring-like bounce
    });

    // Haptic
    try { if ("vibrate" in navigator) navigator.vibrate([12, 30, 8]); } catch { /* no-op */ }

    setStage("result");
  }, [coinControls, finalRotY, reduced]);

  useEffect(() => {
    if (phase === "coin_toss_flipping") {
      runFlip();
    }
  }, [phase, runFlip]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE_OUT }}
      className="relative flex flex-col items-center justify-center min-h-[68vh] gap-10 text-center px-4 overflow-hidden"
    >
      {/* Ambient night-sky backdrop */}
      <div
        className="absolute inset-0 pointer-events-none rounded-3xl"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, hsl(250 30% 16% / 0.55) 0%, transparent 65%), " +
            "radial-gradient(ellipse at 50% 100%, hsl(18 60% 12% / 0.45) 0%, transparent 55%)",
        }}
        aria-hidden="true"
      />
      <StarField visible={stage !== "spinning"} />

      {/* ── Header copy ── */}
      <AnimatePresence mode="wait">
        {stage === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10, transition: { duration: 0.18 } }}
            transition={{ duration: 0.35, ease: EASE_OUT }}
            className="flex flex-col items-center gap-3 relative z-10"
          >
            <motion.span
              initial={{ letterSpacing: "0.1em", opacity: 0 }}
              animate={{ letterSpacing: "0.25em", opacity: 1 }}
              transition={{ duration: 0.5, ease: EASE_OUT }}
              className="text-[10px] font-bold uppercase text-[var(--accent-ember)]"
              aria-hidden="true"
            >
              ✦ &nbsp;Coin Toss&nbsp; ✦
            </motion.span>
            <h2 className="font-display text-3xl sm:text-4xl text-[var(--ink-primary)]">
              Who goes first?
            </h2>
            <p className="text-sm text-[var(--ink-tertiary)] mt-1">
              {isTosser ? "Flip the coin to decide." : `Waiting for ${player1.displayName} to flip…`}
            </p>
          </motion.div>
        )}

        {stage === "spinning" && (
          <motion.div
            key="spinning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center gap-2 relative z-10"
          >
            <motion.p
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
              className="text-sm text-[var(--ink-secondary)] tracking-widest font-mono"
            >
              Tossing…
            </motion.p>
          </motion.div>
        )}

        {(stage === "landing" || stage === "result") && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35, ease: EASE_OUT }}
            className="flex flex-col items-center gap-2 relative z-10"
          >
            <motion.span
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 0.5, delay: 0.1, ease: EASE_OUT }}
              className="block h-px bg-gradient-to-r from-transparent via-[var(--accent-ember)] to-transparent mb-1"
              aria-hidden="true"
            />
            <h2 className="font-display text-3xl sm:text-4xl text-[var(--ink-primary)]">
              {winner.displayName} goes first.
            </h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.22, duration: 0.3, ease: EASE_OUT }}
              className="text-sm text-[var(--ink-tertiary)] max-w-[260px]"
            >
              They choose the first mood for{" "}
              <strong className="text-[var(--ink-secondary)]">{loser.displayName}</strong> to answer.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Player cards ── */}
      <div className="flex items-end gap-10 relative z-10">
        {[player1, player2].map((player, idx) => {
          const isP1   = idx === 0;
          const isWinner = isP1 ? isWinnerP1 : !isWinnerP1;
          return (
            <motion.div
              key={player.id}
              animate={
                stage === "result" || stage === "landing"
                  ? {
                      scale: isWinner ? 1.1 : 0.92,
                      opacity: isWinner ? 1 : 0.45,
                    }
                  : { scale: 1, opacity: 1 }
              }
              transition={{ duration: 0.45, ease: EASE_OUT }}
              className="flex flex-col items-center gap-2"
            >
              <PlayerAvatar avatar={player.avatar} name={player.displayName} size="sm" />
              <span
                className="text-xs font-semibold transition-colors"
                style={{
                  color:
                    stage === "result" && isWinner
                      ? WINNER_COLOR
                      : "var(--ink-secondary)",
                }}
              >
                {player.displayName}
              </span>
              {/* Winner crown */}
              <AnimatePresence>
                {stage === "result" && isWinner && (
                  <motion.span
                    initial={{ opacity: 0, y: 4, scale: 0.7 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.15, duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                    className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: WINNER_COLOR }}
                  >
                    First
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* ── The Coin ── */}
      <div
        className="relative flex items-center justify-center"
        style={{ perspective: "900px", width: 160, height: 180 }}
      >
        {/* Floor shadow */}
        <motion.div
          animate={
            stage === "spinning"
              ? { scale: [1, 0.25, 0.25, 0.9, 1], opacity: [0.25, 0.04, 0.04, 0.35, 0.25] }
              : stage === "result"
              ? { scale: 1.15, opacity: 0.35 }
              : { scale: 1, opacity: 0.25 }
          }
          transition={{ duration: stage === "spinning" ? 2.6 : 0.4, ease: "easeInOut" }}
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-28 h-5 rounded-full blur-xl pointer-events-none"
          style={{ background: "rgba(0,0,0,0.25)" }}
        />

        {/* Burst on landing */}
        <AnimatePresence>
          {stage === "landing" && !reduced && (
            <BurstParticles accentColor={WINNER_COLOR} />
          )}
        </AnimatePresence>

        {/* Landing bloom ring */}
        <AnimatePresence>
          {stage === "landing" && !reduced && (
            <motion.div
              initial={{ opacity: 0.8, scale: 0.7 }}
              animate={{ opacity: 0, scale: 2.2 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{ border: `2px solid ${WINNER_COLOR}` }}
              aria-hidden="true"
            />
          )}
        </AnimatePresence>

        {/* Winner glow halo */}
        <AnimatePresence>
          {stage === "result" && !reduced && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{ boxShadow: WINNER_GLOW }}
              aria-hidden="true"
            />
          )}
        </AnimatePresence>

        {/* THE COIN */}
        <motion.div
          animate={coinControls}
          initial={{ rotateY: 0, y: 0, scale: 1 }}
          style={{
            width: 140,
            height: 140,
            transformStyle: "preserve-3d",
            borderRadius: "50%",
          }}
        >
          {/* Coin rim (depth illusion) */}
          <div
            className="absolute inset-[3px] rounded-full"
            style={{
              transform: "translateZ(-5px)",
              backfaceVisibility: "hidden",
              background: "linear-gradient(135deg, hsl(40 60% 28%), hsl(40 60% 42%), hsl(40 60% 28%))",
            }}
          />

          {/* Face A — Player 1 (Ember / Sun) */}
          <div
            className="absolute inset-0 rounded-full flex flex-col items-center justify-center gap-1"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "translateZ(2px)",
              background: P1_BG,
              border: `3px solid ${P1_RING}`,
            }}
          >
            {/* Radial texture overlay */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none opacity-20"
              style={{
                background: "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.5) 0%, transparent 60%)",
              }}
            />
            <PlayerAvatar avatar={player1.avatar} name={player1.displayName} size="md" />
            <span className="font-bold text-[9px] text-white/90 tracking-wide truncate max-w-[88px] relative z-10">
              {player1.displayName}
            </span>
          </div>

          {/* Face B — Player 2 (Dusk / Moon) */}
          <div
            className="absolute inset-0 rounded-full flex flex-col items-center justify-center gap-1"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg) translateZ(2px)",
              background: P2_BG,
              border: `3px solid ${P2_RING}`,
            }}
          >
            <div
              className="absolute inset-0 rounded-full pointer-events-none opacity-20"
              style={{
                background: "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.4) 0%, transparent 60%)",
              }}
            />
            <PlayerAvatar avatar={player2.avatar} name={player2.displayName} size="md" />
            <span className="font-bold text-[9px] text-white/90 tracking-wide truncate max-w-[88px] relative z-10">
              {player2.displayName}
            </span>
          </div>
        </motion.div>
      </div>

      {/* ── Flip button ── */}
      <AnimatePresence>
        {stage === "intro" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            className="relative z-10 h-14 flex items-center justify-center"
          >
            {isTosser ? (
              <motion.button
                onClick={onFlip}
                whileHover={reduced ? {} : { scale: 1.06 }}
                whileTap={reduced ? {} : { scale: 0.94 }}
                animate={reduced ? {} : {
                  boxShadow: [
                    "0 0 0px 0px hsl(18 76% 52% / 0)",
                    "0 0 0px 6px hsl(18 76% 52% / 0.18)",
                    "0 0 0px 0px hsl(18 76% 52% / 0)",
                  ],
                }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                className="px-8 py-3 bg-[var(--accent-ember)] text-white font-semibold rounded-full text-sm tracking-wide cursor-pointer shadow-lg"
                id="flip-coin-btn"
              >
                Flip the coin
              </motion.button>
            ) : (
              <motion.p
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                className="text-sm text-[var(--ink-tertiary)]"
              >
                Waiting for {player1.displayName} to flip…
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
