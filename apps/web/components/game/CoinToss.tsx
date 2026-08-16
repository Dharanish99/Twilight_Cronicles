"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { PlayerState } from "@twilight/shared-types";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { Sparkles, Crown } from "lucide-react";

interface CoinTossProps {
  player1: PlayerState;
  player2: PlayerState;
  winnerId: string;
  isTosser: boolean;
  phase: "coin_toss_waiting" | "coin_toss_flipping";
  onFlip?: () => void;
}

// Particle burst component
function SparkleParticles({ active }: { active: boolean }) {
  if (!active) return null;
  const particles = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * 360;
    const distance = 80 + Math.random() * 40;
    const x = Math.cos((angle * Math.PI) / 180) * distance;
    const y = Math.sin((angle * Math.PI) / 180) * distance;
    const delay = Math.random() * 0.3;
    const size = 4 + Math.random() * 6;
    return { x, y, delay, size, id: i };
  });

  return (
    <div className="absolute inset-0 pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
          animate={{
            x: p.x,
            y: p.y,
            opacity: [1, 1, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: 1.2,
            delay: p.delay,
            ease: "easeOut",
          }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: p.size,
            height: p.size,
            background:
              p.id % 3 === 0
                ? "var(--accent-ember)"
                : p.id % 3 === 1
                ? "var(--cat-playful)"
                : "var(--cat-emotional)",
          }}
        />
      ))}
    </div>
  );
}

export function CoinToss({
  player1,
  player2,
  winnerId,
  isTosser,
  phase,
  onFlip,
}: CoinTossProps) {
  const [stage, setStage] = useState<"intro" | "spinning" | "landing" | "result">("intro");

  // In waiting phase, winnerId is not yet known.
  // We use fallback to player1 just for the face rendering, 
  // but it won't spin until phase becomes coin_toss_flipping.
  const resolvedWinnerId = winnerId || player1.id;
  const isWinnerP1 = resolvedWinnerId === player1.id;
  
  const winner = isWinnerP1 ? player1 : player2;
  const loser = isWinnerP1 ? player2 : player1;

  const finalRotation = isWinnerP1 ? 1800 : 1980;

  useEffect(() => {
    // When phase changes to flipping, trigger the animation sequence
    if (phase === "coin_toss_flipping") {
      setStage("spinning");
      const t1 = setTimeout(() => setStage("landing"), 2000);
      const t2 = setTimeout(() => setStage("result"), 2600);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [phase]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 text-center px-4">
      {/* Header */}
      <AnimatePresence mode="wait">
        {stage === "intro" && (
          <motion.div
            key="intro-header"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center gap-2"
          >
            <span className="category-label text-[var(--accent-ember)] font-semibold tracking-widest">
              ✦ Coin Toss Ceremony ✦
            </span>
            <h2 className="font-display text-3xl sm:text-4xl text-ink-primary font-serif">
              Who picks first?
            </h2>
            <div className="mt-4 h-12 flex items-center justify-center w-full">
              {isTosser ? (
                <button
                  onClick={onFlip}
                  className="px-6 py-2.5 bg-[var(--accent-ember)] hover:bg-[var(--accent-ember-dark)] text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <Sparkles size={16} /> Flip Coin
                </button>
              ) : (
                <p className="text-sm font-medium text-ink-tertiary animate-pulse">
                  Waiting for partner to flip the coin...
                </p>
              )}
            </div>
          </motion.div>
        )}
        {(stage === "spinning" || stage === "landing") && (
          <motion.div
            key="spinning-header"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center gap-1"
          >
            <p className="text-sm text-ink-tertiary font-mono tracking-wider animate-pulse">
              Tossing...
            </p>
          </motion.div>
        )}
        {stage === "result" && (
          <motion.div
            key="result-header"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-1"
          >
            <div className="flex items-center gap-2">
              <Crown size={20} className="text-[var(--accent-ember)]" />
              <span className="category-label text-[var(--accent-ember)] font-bold">
                Toss Winner
              </span>
              <Crown size={20} className="text-[var(--accent-ember)]" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VS Names */}
      <div className="flex items-center gap-6 text-sm text-ink-secondary">
        <motion.span
          animate={{
            color: stage === "result" && isWinnerP1 ? "var(--accent-ember)" : undefined,
            fontWeight: stage === "result" && isWinnerP1 ? 700 : 400,
          }}
          className="font-medium"
        >
          {player1.displayName}
        </motion.span>
        <span className="text-ink-tertiary font-mono text-xs">VS</span>
        <motion.span
          animate={{
            color: stage === "result" && !isWinnerP1 ? "var(--accent-ember)" : undefined,
            fontWeight: stage === "result" && !isWinnerP1 ? 700 : 400,
          }}
          className="font-medium"
        >
          {player2.displayName}
        </motion.span>
      </div>

      {/* 3D Coin Stage */}
      <div
        className="relative flex items-center justify-center"
        style={{ perspective: "1200px", width: 160, height: 180 }}
      >
        {/* Floor shadow */}
        <motion.div
          animate={{
            scale:
              stage === "spinning"
                ? [1, 0.3, 0.3, 1.1, 1]
                : stage === "landing"
                ? [1, 1.05, 1]
                : 1,
            opacity:
              stage === "spinning"
                ? [0.35, 0.08, 0.08, 0.4, 0.35]
                : 0.35,
          }}
          transition={{ duration: stage === "spinning" ? 2 : 0.5, ease: "easeInOut" }}
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-24 h-5 rounded-full bg-black/15 blur-lg pointer-events-none"
        />

        {/* Sparkle particles on result */}
        <SparkleParticles active={stage === "result"} />

        {/* 3D Coin */}
        <motion.div
          initial={{ rotateY: 0, y: 0, scale: 0.85 }}
          animate={
            stage === "spinning" || stage === "landing" || stage === "result"
              ? {
                  rotateY: finalRotation,
                  y: [0, -120, -120, 0],
                  scale: [0.85, 1.15, 1.15, 1.05],
                }
              : { rotateY: 0, y: 0, scale: 0.85 }
          }
          transition={{
            duration: 2.6,
            ease: [0.22, 1, 0.36, 1],
            times: [0, 0.3, 0.7, 1],
          }}
          className="relative w-[140px] h-[140px] rounded-full cursor-default"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Coin edge (gives the 3D disc thickness illusion) */}
          <div
            className="absolute inset-[3px] rounded-full"
            style={{
              transform: "translateZ(-4px)",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              background: "linear-gradient(135deg, #b8860b, #daa520, #b8860b)",
              boxShadow: "inset 0 0 15px rgba(0,0,0,0.3)",
            }}
          />

          {/* Side A: Player 1 (Front face) */}
          <div
            className="absolute inset-0 rounded-full flex flex-col items-center justify-center"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "translateZ(1px)",
              background: "linear-gradient(145deg, #faf5f0, #f5ebe0)",
              border: "4px solid var(--accent-ember)",
              boxShadow:
                stage === "result" && isWinnerP1
                  ? "0 0 30px rgba(225, 89, 42, 0.5), 0 0 60px rgba(225, 89, 42, 0.2)"
                  : "0 4px 20px rgba(0,0,0,0.15)",
            }}
          >
            <div className="flex flex-col items-center gap-1">
              <PlayerAvatar avatar={player1.avatar} name={player1.displayName} size="md" />
              <span className="font-bold text-xs text-ink-primary truncate max-w-[90px]">
                {player1.displayName}
              </span>
            </div>
          </div>

          {/* Side B: Player 2 (Back face, rotated 180deg) */}
          <div
            className="absolute inset-0 rounded-full flex flex-col items-center justify-center"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg) translateZ(1px)",
              background: "linear-gradient(145deg, #f0f5f5, #e0ebe5)",
              border: "4px solid var(--cat-playful)",
              boxShadow:
                stage === "result" && !isWinnerP1
                  ? "0 0 30px rgba(200, 141, 26, 0.5), 0 0 60px rgba(200, 141, 26, 0.2)"
                  : "0 4px 20px rgba(0,0,0,0.15)",
            }}
          >
            <div className="flex flex-col items-center gap-1">
              <PlayerAvatar avatar={player2.avatar} name={player2.displayName} size="md" />
              <span className="font-bold text-xs text-ink-primary truncate max-w-[90px]">
                {player2.displayName}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Result Banner */}
      <div className="h-20 flex items-center justify-center">
        <AnimatePresence>
          {stage === "result" && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", damping: 15, stiffness: 200 }}
              className="flex flex-col items-center gap-2 bg-surface-elevated px-8 py-4 rounded-[var(--radius-lg)] border-2 border-[var(--accent-ember)] shadow-xl"
            >
              <div className="flex items-center gap-2 text-ink-primary font-bold text-lg">
                <Sparkles size={18} className="text-[var(--accent-ember)]" />
                <span>{winner.displayName} picks first!</span>
                <Sparkles size={18} className="text-[var(--accent-ember)]" />
              </div>
              <p className="text-xs text-ink-secondary max-w-[280px]">
                They will choose the first conversation mood for{" "}
                <strong>{loser.displayName}</strong> to answer.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
