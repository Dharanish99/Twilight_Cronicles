"use client";

import { useEffect, use, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Settings as SettingsIcon, Flag } from "lucide-react";
import type { CategoryId, ReactionId } from "@twilight/shared-types";
import { useGameStore } from "@/lib/state/gameStore";
import { CategoryGrid } from "@/components/game/CategoryGrid";
import { QuestionCard } from "@/components/game/QuestionCard";
import { WaitingScreen } from "@/components/game/WaitingScreen";
import { RevealCard } from "@/components/game/RevealCard";
import { CoinToss } from "@/components/game/CoinToss";
import { TurnIndicator } from "@/components/ui/TurnIndicator";
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
  } = useGameStore();

  const [activeReactionPopups, setActiveReactionPopups] = useState<
    { id: string; emoji: string }[]
  >([]);

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

  // ─────────── PLAYER IDENTITY (the core fix) ───────────
  const player1 = room?.players?.[0];
  const player2 = room?.players?.[1];

  // Determine which server player "I" am.
  // The server assigned me a UUID when I created/joined.
  // My localPlayer.id was reconciled to that UUID in the state_snapshot handler.
  // Match by reconciled ID first, then by displayName as fallback.
  const myPlayerId = localPlayer?.id;

  const isMePlayer1 = !!(
    myPlayerId &&
    player1 &&
    (myPlayerId === player1.id || localPlayer?.displayName === player1.displayName)
  );
  const isMePlayer2 = !!(
    myPlayerId &&
    player2 &&
    (myPlayerId === player2.id || localPlayer?.displayName === player2.displayName)
  );

  // If neither matched by ID, fall back to displayName
  const resolvedIsMeP1 = isMePlayer1 && !isMePlayer2 ? true : !isMePlayer2 && !isMePlayer1 ? true : isMePlayer1;

  const myPlayer = resolvedIsMeP1 ? player1 : player2;
  const partner = resolvedIsMeP1 ? player2 : player1;
  const partnerName = partner?.displayName ?? "Partner";

  const turn = room?.turn;
  const round = turn?.round ?? 1;
  const totalRounds = room?.settings?.rounds ?? 6;
  const phase = turn?.phase ?? "choosing_category";
  const chosenCategory = turn?.chosenCategory ?? currentQuestion?.category;

  // Role determination: compare my actual server-side player ID with the turn's picker/answerer IDs
  const myServerId = myPlayer?.id;
  const isPicker = !!(myServerId && turn?.pickerPlayerId === myServerId);
  const isAnswerer = !!(myServerId && turn?.answererPlayerId === myServerId);

  const getRoleDescription = () => {
    if (phase === "coin_toss") return "🪙 Coin toss ceremony";
    if (phase === "choosing_category" || phase === "question_loading") {
      return isPicker
        ? `You are choosing a mood for ${partnerName}`
        : `${partnerName} is choosing a mood for you`;
    }
    if (phase === "answering" || phase === "locked") {
      return isAnswerer ? "Your turn to answer" : `${partnerName} is answering`;
    }
    return "Answer revealed";
  };

  const handleSelectCategory = useCallback(
    (cat: CategoryId) => selectCategory(cat),
    [selectCategory]
  );

  const handleReact = useCallback(
    (reaction: ReactionId) => {
      sendReaction(reaction);
      const emojiMap: Record<ReactionId, string> = {
        heart: "❤️",
        spark: "✨",
        soft: "🥺",
        same: "💯",
        surprising: "😮",
      };
      const popId = `${Date.now()}`;
      setActiveReactionPopups((prev) => [
        ...prev,
        { id: popId, emoji: emojiMap[reaction] || "✨" },
      ]);
      setTimeout(() => {
        setActiveReactionPopups((prev) => prev.filter((p) => p.id !== popId));
      }, 2000);
    },
    [sendReaction]
  );

  const handleContinueAfterReveal = useCallback(() => {
    shareAnswer();
  }, [shareAnswer]);

  // Debug role state in development
  useEffect(() => {
    if (process.env.NODE_ENV === "development" && turn && myPlayer) {
      console.log("[PlayPage] Identity debug:", {
        localPlayerId: localPlayer?.id,
        localPlayerName: localPlayer?.displayName,
        myServerId: myPlayer.id,
        myServerName: myPlayer.displayName,
        pickerPlayerId: turn.pickerPlayerId,
        answererPlayerId: turn.answererPlayerId,
        isPicker,
        isAnswerer,
        phase: turn.phase,
      });
    }
  }, [turn?.phase, turn?.pickerPlayerId, turn?.answererPlayerId, isPicker, isAnswerer, localPlayer, myPlayer]);

  return (
    <div className="min-h-screen bg-surface-base text-ink-primary flex flex-col justify-between p-5 sm:p-8 relative overflow-hidden">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Real-time Reaction Floating Bubbles */}
      <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
        {activeReactionPopups.map((p) => (
          <span
            key={p.id}
            className="text-6xl animate-bounce duration-1000 opacity-90"
          >
            {p.emoji}
          </span>
        ))}
      </div>

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
            <Link
              href={`/report?roomId=${roomId}&questionId=${currentQuestion?.questionId ?? ""}`}
              className="p-2 rounded-full hover:bg-surface-sunken transition-colors text-ink-tertiary hover:text-[var(--danger)]"
              aria-label="Report Question"
            >
              <Flag size={18} />
            </Link>
            <Link
              href={`/room/${roomId}/settings`}
              className="p-2 rounded-full hover:bg-surface-sunken transition-colors text-ink-tertiary hover:text-ink-primary"
              aria-label="Room Settings"
            >
              <SettingsIcon size={18} />
            </Link>
          </div>
        </div>

        <TurnIndicator
          round={round}
          totalRounds={totalRounds}
          roleDescription={getRoleDescription()}
        />
      </header>

      {/* Main Interactive Stage */}
      <main className="max-w-2xl mx-auto w-full my-auto py-8">
        {/* PHASE 0: 3D COIN TOSS CEREMONY */}
        {phase === "coin_toss" && player1 && player2 && (
          <CoinToss
            player1={player1}
            player2={player2}
            winnerId={turn?.tossWinnerId || turn?.pickerPlayerId || player1.id}
          />
        )}

        {/* PHASE 1: CHOOSING CATEGORY */}
        {phase === "choosing_category" && (
          <>
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
                customMessage={`${partnerName} is choosing a mood for you…`}
              />
            )}
          </>
        )}

        {/* PHASE 2: QUESTION LOADING */}
        {phase === "question_loading" && (
          <WaitingScreen
            partnerName={partnerName}
            phase={phase}
            chosenCategory={chosenCategory}
            round={round}
            totalRounds={totalRounds}
            customMessage={
              isAnswerer
                ? `Preparing a question in ${chosenCategory ?? "mood"} for you…`
                : `${partnerName} will answer a question in ${chosenCategory ?? "mood"}…`
            }
          />
        )}

        {/* PHASE 3 & 4: ANSWERING & LOCKED */}
        {(phase === "answering" || phase === "locked") && (
          <>
            {isAnswerer ? (
              <QuestionCard
                round={round}
                totalRounds={totalRounds}
                category={currentQuestion?.category ?? chosenCategory ?? "deep"}
                question={currentQuestion?.text ?? "Loading question..."}
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
                customMessage={`${partnerName} is answering the ${chosenCategory ?? "selected"} mood question…`}
              />
            )}
          </>
        )}

        {/* PHASE 5: SHARED / REVEAL */}
        {phase === "shared" && sharedAnswer && (
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
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-2xl mx-auto w-full text-center py-4 text-xs text-ink-tertiary flex justify-between items-center">
        <span>Room Code: <strong className="font-mono">{roomId}</strong></span>
        <span>{room?.settings?.intensityCeiling ?? "Balanced"} Mode</span>
      </footer>
    </div>
  );
}
