"use client";

import { useEffect, use, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Settings as SettingsIcon, Flag, Pencil, ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { CategoryId, ReactionId } from "@twilight/shared-types";
import { useGameStore } from "@/lib/state/gameStore";
import { CategoryGrid } from "@/components/game/CategoryGrid";
import { QuestionCard } from "@/components/game/QuestionCard";
import { WaitingScreen } from "@/components/game/WaitingScreen";
import { RevealCard } from "@/components/game/RevealCard";
import { CoinToss } from "@/components/game/CoinToss";
import { ReportModal } from "@/components/game/ReportModal";
import { AnswerSentScreen } from "@/components/game/AnswerSentScreen";
import { DoodlePanel } from "@/components/game/DoodlePanel";
import { PlayerLeftOverlay } from "@/components/game/PlayerLeftOverlay";
import { DuskArc } from "@/components/ui/DuskArc";
import { ConnectionIndicator } from "@/components/ui/ConnectionIndicator";
import { ToastContainer } from "@/components/ui/Toast";

interface PlayPageProps {
  params: Promise<{ roomId: string }>;
}

export default function PlayPage({ params }: PlayPageProps) {
  const { roomId } = use(params);
  const router = useRouter();
  const initRef = useRef(false);

  const {
    room,
    localPlayer,
    connectionStatus,
    currentQuestion,
    sharedAnswer,
    draftText,
    isDraftLocked,
    selectCategory,
    sendDraftUpdate,
    lockAnswer,
    shareAnswer,
    skipQuestion,
    sendReaction,
    joinRoom,
    initSocketListeners,
    toasts,
    removeToast,
    myServerId,
    flipCoin,
    doodleGallery,
    sendDoodle,
    sendDoodleReaction,
    partnerLeft,
    setPartnerLeft,
  } = useGameStore();

  const [activeReactionPopups, setActiveReactionPopups] = useState<
    { id: string; emoji: string }[]
  >([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isDoodlePanelOpen, setIsDoodlePanelOpen] = useState(false);
  const [overlayDismissed, setOverlayDismissed]   = useState(false);
  // Session-level used quote IDs — prevents same quote appearing in consecutive turns
  const [usedQuoteIds, setUsedQuoteIds] = useState<Set<string>>(new Set());
  // Track unread doodle count (increments when panel is closed + new entry arrives)
  const prevGalleryLen = useRef(0);
  const [unreadDoodles, setUnreadDoodles] = useState(0);

  // Initialize socket ONCE on mount
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    initSocketListeners();
  }, [initSocketListeners]);

  // Re-join room if we landed here without state (e.g. page refresh)
  useEffect(() => {
    if (!room && roomId && localPlayer) {
      joinRoom(localPlayer.displayName, localPlayer.avatar, roomId);
    }
  }, [roomId, room, localPlayer, joinRoom]);

  // If room is waiting or partner missing, go back to lobby
  useEffect(() => {
    if (room && (room.status === "waiting" || !room.players?.[1])) {
      router.push(`/room/${roomId}/lobby`);
    }
  }, [room, roomId, router]);

  // Game completed → complete screen
  useEffect(() => {
    if (room?.status === "completed") {
      router.push(`/room/${roomId}/complete`);
    }
  }, [room?.status, roomId, router]);

  // Unread badge — increment when panel is closed and gallery grows
  useEffect(() => {
    if (doodleGallery.length > prevGalleryLen.current) {
      if (!isDoodlePanelOpen) {
        setUnreadDoodles((n) => n + (doodleGallery.length - prevGalleryLen.current));
      }
    }
    prevGalleryLen.current = doodleGallery.length;
  }, [doodleGallery.length, isDoodlePanelOpen]);

  // Clear unread when panel opens
  useEffect(() => {
    if (isDoodlePanelOpen) setUnreadDoodles(0);
  }, [isDoodlePanelOpen]);

  // Reset overlay-dismissed when partner reconnects
  useEffect(() => {
    if (!partnerLeft) setOverlayDismissed(false);
  }, [partnerLeft]);

  // ─────────── PLAYER IDENTITY ───────────
  const player1 = room?.players?.[0];
  const player2 = room?.players?.[1];

  const isMePlayer1 = !!(myServerId && player1 && myServerId === player1.id);
  const isMePlayer2 = !!(myServerId && player2 && myServerId === player2.id);
  const resolvedIsMeP1 = isMePlayer1 && !isMePlayer2 ? true : !isMePlayer2 && !isMePlayer1 ? true : isMePlayer1;

  const myPlayer  = resolvedIsMeP1 ? player1 : player2;
  const partner   = resolvedIsMeP1 ? player2 : player1;
  const partnerName = partner?.displayName ?? "Partner";

  const turn         = room?.turn;
  const round        = turn?.round ?? 1;
  const totalRounds  = room?.settings?.rounds ?? 6;
  const phase        = turn?.phase ?? "choosing_category";
  const chosenCategory = turn?.chosenCategory ?? currentQuestion?.category;

  const isPicker   = !!(myServerId && turn?.pickerPlayerId === myServerId);
  const isAnswerer = !!(myServerId && turn?.answererPlayerId === myServerId);
  const isTosser   = !!(myServerId && turn?.tosserPlayerId === myServerId);
  // Waiting = not the answerer (during active question phases)
  const isWaiting  = !isAnswerer && (phase === "answering" || phase === "locked");

  const getRoleDescription = () => {
    if (phase === "coin_toss_waiting" || phase === "coin_toss_flipping") return "🪙 Coin toss";
    if (phase === "choosing_category" || phase === "question_loading") {
      return isPicker ? `You are choosing for ${partnerName}` : `${partnerName} is choosing…`;
    }
    if (phase === "answering" || phase === "locked") {
      return isAnswerer ? "Your turn to answer" : `${partnerName} is answering`;
    }
    return "Answer revealed";
  };

  const handleSelectCategory = useCallback((cat: CategoryId) => selectCategory(cat), [selectCategory]);

  const handleReact = useCallback((reaction: ReactionId) => {
    sendReaction(reaction);
    const emojiMap: Record<ReactionId, string> = {
      heart: "❤️", spark: "✨", soft: "🥺", same: "💯", surprising: "😮",
    };
    const popId = `${Date.now()}`;
    setActiveReactionPopups((prev) => [...prev, { id: popId, emoji: emojiMap[reaction] || "✨" }]);
    setTimeout(() => setActiveReactionPopups((prev) => prev.filter((p) => p.id !== popId)), 2000);
  }, [sendReaction]);

  const handleContinueAfterReveal = useCallback(() => shareAnswer(), [shareAnswer]);

  const handleSendDoodle = useCallback((dataUrl: string, r: number) => {
    sendDoodle(dataUrl, r);
  }, [sendDoodle]);

  const handleDoodleReact = useCallback((doodleId: string, emoji: string) => {
    sendDoodleReaction(doodleId, emoji);
  }, [sendDoodleReaction]);

  // Show partner-left overlay
  const showPartnerLeft = !!partnerLeft && !overlayDismissed;

  // Debug role state in development
  useEffect(() => {
    if (process.env.NODE_ENV === "development" && turn && myPlayer) {
      console.log("[PlayPage] Identity debug:", {
        myServerId: myPlayer.id, myServerName: myPlayer.displayName,
        pickerPlayerId: turn.pickerPlayerId, answererPlayerId: turn.answererPlayerId,
        isPicker, isAnswerer, phase: turn.phase,
      });
    }
  }, [turn?.phase, turn?.pickerPlayerId, turn?.answererPlayerId, isPicker, isAnswerer, myPlayer]);

  return (
    <div className="min-h-screen bg-surface-base text-ink-primary flex flex-col justify-between p-5 sm:p-8 relative overflow-hidden">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Real-time reaction bubbles */}
      <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
        {activeReactionPopups.map((p) => (
          <span key={p.id} className="text-6xl animate-bounce duration-1000 opacity-90">{p.emoji}</span>
        ))}
      </div>

      {/* Player Left overlay — highest priority */}
      {showPartnerLeft && partnerLeft && (
        <PlayerLeftOverlay
          partnerName={partnerLeft.displayName}
          roomId={roomId}
          onDismiss={() => setOverlayDismissed(true)}
        />
      )}

      {/* Doodle Panel */}
      <DoodlePanel
        isOpen={isDoodlePanelOpen}
        onClose={() => setIsDoodlePanelOpen(false)}
        isWaiting={isWaiting}
        currentRound={round}
        gallery={doodleGallery}
        myPlayerId={myServerId ?? ""}
        partnerName={partnerName}
        partnerAvatarId={(partner?.avatar ?? "dusk") as any}
        myAvatarId={(myPlayer?.avatar ?? "ember") as any}
        onSendDoodle={handleSendDoodle}
        onReact={handleDoodleReact}
      />

      {/* Header */}
      <header className="max-w-2xl mx-auto w-full flex flex-col gap-3 py-2 border-b border-theme-subtle pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-display font-medium text-lg text-ink-primary">
              Twilight <span className="text-[var(--accent-ember)]">Chronicles</span>
            </Link>
            <ConnectionIndicator status={connectionStatus} />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              className="p-2 rounded-full hover:bg-surface-sunken transition-colors text-ink-tertiary hover:text-[var(--danger)]"
              aria-label="Report Question"
              id="report-question-btn"
            >
              <Flag size={18} />
            </button>
            <Link
              href={`/room/${roomId}/settings`}
              className="p-2 rounded-full hover:bg-surface-sunken transition-colors text-ink-tertiary hover:text-ink-primary"
              aria-label="Room Settings"
            >
              <SettingsIcon size={18} />
            </Link>
          </div>
        </div>

        {/* Progress bar + role + doodle gallery button */}
        <div className="flex flex-col gap-1.5">
          <DuskArc round={round} totalRounds={totalRounds} />
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-secondary font-medium">
              {getRoleDescription()}
            </span>

            {/* Doodle gallery button — below progress bar, top-right */}
            <button
              onClick={() => setIsDoodlePanelOpen(true)}
              className="relative flex items-center gap-1.5 text-xs text-[var(--ink-tertiary)] hover:text-[var(--ink-secondary)] transition-colors px-2 py-1 rounded-full hover:bg-[var(--bg-sunken)]"
              aria-label={`Open doodle gallery${unreadDoodles > 0 ? `, ${unreadDoodles} new` : ""}`}
              id="doodle-gallery-btn"
            >
              <ImageIcon size={14} />
              <span>Doodles</span>
              {unreadDoodles > 0 && (
                <span className="absolute -top-1 -right-1 bg-[var(--accent-ember)] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center tabular-nums">
                  {unreadDoodles > 9 ? "9+" : unreadDoodles}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Interactive Stage */}
      <main className="max-w-2xl mx-auto w-full my-auto py-8">
        <AnimatePresence mode="wait">

        {/* PHASE 0: COIN TOSS */}
        {(phase === "coin_toss_waiting" || phase === "coin_toss_flipping") && player1 && player2 && (
          <motion.div
            key="coin-toss"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
          <CoinToss
            player1={player1}
            player2={player2}
            winnerId={turn?.tossWinnerId || ""}
            isTosser={isTosser}
            phase={phase}
            onFlip={flipCoin}
          />
          </motion.div>
        )}

        {/* PHASE 1: CHOOSING CATEGORY */}
        {phase === "choosing_category" && (
          <motion.div
            key="choosing-category"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {isPicker ? (
              <CategoryGrid
                enabledCategories={room?.settings?.categories}
                onSelect={handleSelectCategory}
                partnerName={partnerName}
              />
            ) : (
              <WaitingScreen
                partnerName={partnerName}
                phase={phase}
                round={round}
                totalRounds={totalRounds}
                questionKey={currentQuestion?.questionId}
              />
            )}
          </motion.div>
        )}

        {/* PHASE 2: QUESTION LOADING */}
        {phase === "question_loading" && (
          <motion.div
            key="question-loading"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <WaitingScreen
              partnerName={partnerName}
              phase={phase}
              chosenCategory={chosenCategory}
              round={round}
              totalRounds={totalRounds}
              questionKey={currentQuestion?.questionId}
            />
          </motion.div>
        )}

        {/* PHASE 3 & 4: ANSWERING & LOCKED */}
        {(phase === "answering" || phase === "locked") && (
          <motion.div
            key="answering"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {isAnswerer ? (
              <QuestionCard
                round={round}
                totalRounds={totalRounds}
                category={currentQuestion?.category ?? chosenCategory ?? "deep"}
                question={currentQuestion?.text ?? "Loading question..."}
                intensity={(currentQuestion as any)?.intensity ?? 3}
                state={isDraftLocked ? "locked" : "typing"}
                draft={draftText}
                onDraftChange={sendDraftUpdate}
                onLock={lockAnswer}
                onShare={() => shareAnswer()}
                onSkip={skipQuestion}
                onUnlockEdit={() => lockAnswer()}
                partnerName={partnerName}
                followUpPrompt={currentQuestion?.followUpPrompt}
              />
            ) : (
              <WaitingScreen
                partnerName={partnerName}
                phase={phase}
                chosenCategory={chosenCategory}
                round={round}
                totalRounds={totalRounds}
                questionKey={currentQuestion?.questionId}
              />
            )}
          </motion.div>
        )}

        {/* PHASE 5: SHARED / REVEAL */}
        {phase === "shared" && sharedAnswer && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {isPicker ? (
              <RevealCard
                question={sharedAnswer.text}
                category={sharedAnswer.category}
                answer={sharedAnswer.answerText}
                answeredBy={{
                  name: sharedAnswer.answeredBy.name,
                  avatar: sharedAnswer.answeredBy.avatar as any,
                }}
                onReact={handleReact}
                onContinue={handleContinueAfterReveal}
              />
            ) : (
              <AnswerSentScreen
                partnerName={partnerName}
                category={sharedAnswer.category}
                usedQuoteIds={usedQuoteIds}
                onQuoteShown={(id) => setUsedQuoteIds((prev) => new Set(prev).add(id))}
              />
            )}
          </motion.div>
        )}

        </AnimatePresence>
      </main>

      {/* Floating Doodle FAB — only for waiting player during active question */}
      {isWaiting && (
        <button
          onClick={() => setIsDoodlePanelOpen(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-[var(--accent-ember)] text-white rounded-full shadow-[0_4px_20px_rgba(225,89,42,0.4)] flex items-center justify-center hover:shadow-[0_6px_28px_rgba(225,89,42,0.55)] active:scale-95 transition-all"
          aria-label="Open doodle canvas"
          id="doodle-fab"
        >
          <Pencil size={22} strokeWidth={2} />
        </button>
      )}

      {/* Footer */}
      <footer className="max-w-2xl mx-auto w-full text-center py-4 text-xs text-ink-tertiary flex justify-between items-center">
        <span>Room Code: <strong className="font-mono">{roomId}</strong></span>
        <span>{room?.settings?.intensityCeiling ?? "Balanced"} Mode</span>
      </footer>

      {/* In-session Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        questionId={currentQuestion?.questionId ?? ""}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
}
