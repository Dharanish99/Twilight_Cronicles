"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { PlayerState } from "@twilight/shared-types";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { Sparkles } from "lucide-react";

interface CoinTossProps {
  player1: PlayerState;
  player2: PlayerState;
  winnerId: string;
  onFinished?: () => void;
}

export function CoinToss({
  player1,
  player2,
  winnerId,
  onFinished,
}: CoinTossProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showWinnerBanner, setShowWinnerBanner] = useState(false);

  const isWinnerP1 = winnerId === player1.id;
  const winner = isWinnerP1 ? player1 : player2;
  const loser = isWinnerP1 ? player2 : player1;

  // If winner is P1, land on 0 / 1800 deg (Front). If P2, land on 180 / 1980 deg (Back).
  const targetRotation = isWinnerP1 ? 1800 : 1980;

  useEffect(() => {
    // Start toss animation after a brief 300ms pause
    const flipTimer = setTimeout(() => {
      setIsFlipped(true);
    }, 400);

    // Reveal winner announcement after flip completes
    const bannerTimer = setTimeout(() => {
      setShowWinnerBanner(true);
    }, 2800);

    // Call onFinished if provided
    const finishTimer = setTimeout(() => {
      if (onFinished) onFinished();
    }, 4000);

    return () => {
      clearTimeout(flipTimer);
      clearTimeout(bannerTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinished]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 text-center px-4">
      {/* Eyebrow */}
      <div className="flex flex-col items-center gap-1">
        <span className="category-label text-[var(--accent-ember)] font-semibold tracking-widest animate-pulse">
          Coin Toss Ceremony
        </span>
        <h2 className="font-display text-3xl sm:text-4xl text-ink-primary font-serif">
          Deciding First Pick
        </h2>
        <p className="text-ink-secondary text-sm">
          Who will choose the first conversation mood?
        </p>
      </div>

      {/* 3D Coin Toss Stage */}
      <div
        className="relative my-4"
        style={{ perspective: "1200px" }}
      >
        {/* Shadow underneath */}
        <motion.div
          animate={{
            scale: isFlipped ? [1, 0.4, 1.1, 1] : 1,
            opacity: isFlipped ? [0.4, 0.1, 0.5, 0.4] : 0.4,
          }}
          transition={{ duration: 2.4, ease: [0.25, 1, 0.5, 1] }}
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-28 h-6 rounded-full bg-black/20 blur-md pointer-events-none"
        />

        {/* 3D Coin */}
        <motion.div
          initial={{ rotateY: 0, y: 0, scale: 0.9 }}
          animate={
            isFlipped
              ? {
                  rotateY: targetRotation,
                  y: [0, -140, 0],
                  scale: [0.9, 1.25, 1],
                }
              : { rotateY: 0, y: 0, scale: 0.9 }
          }
          transition={{
            duration: 2.4,
            ease: [0.25, 1, 0.5, 1],
          }}
          className="relative w-36 h-36 rounded-full cursor-default"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Side A: Player 1 */}
          <div
            className="absolute inset-0 rounded-full flex flex-col items-center justify-center p-3 border-4 border-[var(--accent-ember)] shadow-2xl bg-surface-elevated"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              boxShadow: "0 0 25px rgba(225, 89, 42, 0.35)",
            }}
          >
            <div className="w-full h-full rounded-full bg-gradient-to-br from-[var(--accent-ember-tint)] to-[var(--bg-sunken)] flex flex-col items-center justify-center p-2 border border-[var(--accent-ember)]/30">
              <PlayerAvatar avatar={player1.avatar} name={player1.displayName} size="md" />
              <span className="font-semibold text-xs text-ink-primary truncate max-w-[85px] mt-1">
                {player1.displayName}
              </span>
            </div>
          </div>

          {/* Side B: Player 2 (Rotated 180deg) */}
          <div
            className="absolute inset-0 rounded-full flex flex-col items-center justify-center p-3 border-4 border-[var(--cat-playful)] shadow-2xl bg-surface-elevated"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              boxShadow: "0 0 25px rgba(200, 141, 26, 0.35)",
            }}
          >
            <div className="w-full h-full rounded-full bg-gradient-to-br from-[var(--cat-playful)]/20 to-[var(--bg-sunken)] flex flex-col items-center justify-center p-2 border border-[var(--cat-playful)]/30">
              <PlayerAvatar avatar={player2.avatar} name={player2.displayName} size="md" />
              <span className="font-semibold text-xs text-ink-primary truncate max-w-[85px] mt-1">
                {player2.displayName}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Result Banner */}
      <div className="h-16 flex items-center justify-center">
        {showWinnerBanner ? (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="flex flex-col items-center gap-1 bg-surface-elevated px-6 py-3 rounded-[var(--radius-md)] border-2 border-[var(--accent-ember)] shadow-lg"
          >
            <div className="flex items-center gap-2 text-ink-primary font-semibold text-lg">
              <Sparkles size={18} className="text-[var(--accent-ember)]" />
              <span>{winner.displayName} won the toss!</span>
            </div>
            <p className="text-xs text-ink-secondary">
              They will choose the first mood for {loser.displayName}
            </p>
          </motion.div>
        ) : (
          <p className="text-xs text-ink-tertiary font-mono animate-pulse">
            Tossing coin in the air...
          </p>
        )}
      </div>
    </div>
  );
}
