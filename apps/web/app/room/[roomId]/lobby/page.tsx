"use client";

import { useEffect, use, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Settings as SettingsIcon, Play, Copy, Check, UserPlus } from "lucide-react";
import { useGameStore } from "@/lib/state/gameStore";
import { Button } from "@/components/ui/Button";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { RoomCodeDisplay } from "@/components/ui/RoomCodeDisplay";
import { ConnectionIndicator } from "@/components/ui/ConnectionIndicator";
import { ToastContainer } from "@/components/ui/Toast";
import { motion, AnimatePresence } from "framer-motion";
import { threadExtend } from "@/lib/theme/motion";
import { useReducedMotion } from "@/lib/a11y/useReducedMotion";

interface LobbyPageProps {
  params: Promise<{ roomId: string }>;
}

export default function LobbyPage({ params }: LobbyPageProps) {
  const { roomId } = use(params);
  const router = useRouter();
  const initRef = useRef(false);

  const {
    room,
    localPlayer,
    connectionStatus,
    toggleReady,
    startGame,
    joinRoom,
    initSocketListeners,
    toasts,
    removeToast,
    addToast,
  } = useGameStore();

  const [copiedLink, setCopiedLink] = useState(false);
  const reduced = useReducedMotion();

  // Initialize socket ONCE
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    initSocketListeners();
  }, [initSocketListeners]);

  // Re-join room if we arrived without state (page refresh)
  useEffect(() => {
    if (!room && roomId && localPlayer) {
      joinRoom(localPlayer.displayName, localPlayer.avatar, roomId);
    }
  }, [roomId, room, localPlayer, joinRoom]);

  // CRITICAL FIX: Only navigate to play screen when game is explicitly started and both players joined
  useEffect(() => {
    if (room && room.status === "active" && room.players?.[0] && room.players?.[1]) {
      router.push(`/room/${roomId}/play`);
    }
  }, [room, roomId, router]);

  const player1 = room?.players?.[0];
  const player2 = room?.players?.[1];

  const isLocalP1 = player1?.displayName === localPlayer?.displayName;
  const isLocalP2 = player2?.displayName === localPlayer?.displayName;
  const myPlayer = isLocalP1 ? player1 : player2 || player1;
  const isReady = myPlayer?.ready ?? false;

  const bothReady = !!(player1?.ready && player2?.ready);

  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/join?code=${roomId}`
      : "";

  const copyInviteLink = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    addToast("Invite link copied to clipboard", "success");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="min-h-screen bg-surface-base text-ink-primary flex flex-col justify-between p-5 sm:p-8">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Header */}
      <header className="max-w-2xl mx-auto w-full flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-display font-medium text-lg text-ink-primary">
            Twilight <span className="text-[var(--accent-ember)]">Chronicles</span>
          </Link>
          <ConnectionIndicator status={connectionStatus} />
        </div>

        <Link
          href={`/room/${roomId}/settings`}
          className="p-2 rounded-full hover:bg-surface-sunken transition-colors text-ink-tertiary hover:text-ink-primary"
          aria-label="Room Settings"
        >
          <SettingsIcon size={20} />
        </Link>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto w-full my-auto py-6 flex flex-col items-center gap-8 text-center">
        <div>
          <span className="category-label text-[var(--accent-ember)] font-semibold">
            Game Lobby
          </span>
          <h1 className="font-display text-3xl sm:text-4xl text-ink-primary mt-1 font-serif">
            Waiting to Begin
          </h1>
          <p className="text-ink-secondary text-sm mt-1 max-w-sm">
            Share this room code with your partner so they can join before starting.
          </p>
        </div>

        {/* Room Code & Link */}
        <div className="flex flex-col items-center gap-3 w-full">
          <RoomCodeDisplay code={roomId} label="Share this Room Code" />

          <button
            onClick={copyInviteLink}
            className="inline-flex items-center gap-2 text-xs font-semibold text-ink-secondary hover:text-[var(--accent-ember)] bg-surface-elevated px-5 py-2.5 rounded-full border-2 border-theme-subtle hover:border-[var(--accent-ember)] transition-all cursor-pointer shadow-sm"
          >
            {copiedLink ? <Check size={14} className="text-[var(--success)]" /> : <Copy size={14} />}
            {copiedLink ? "Link Copied!" : "Copy Direct Invite Link"}
          </button>
        </div>

        {/* Players Grid */}
        <div className="relative grid grid-cols-2 gap-4 w-full max-w-md">
          {/* Thread between avatars — draws once when bothReady */}
          <AnimatePresence>
            {bothReady && (
              <div
                aria-hidden="true"
                className="absolute top-[36px] left-[calc(50%-32px)] right-[calc(50%-32px)] h-[2px] overflow-hidden"
              >
                <motion.div
                  {...threadExtend(reduced)}
                  className="h-full w-full bg-[var(--accent-ember)] rounded-full origin-left"
                />
              </div>
            )}
          </AnimatePresence>
          {/* Player 1 Slot */}
          <div className="flex flex-col items-center gap-3 p-5 rounded-[var(--radius-lg)] bg-surface-elevated border border-theme-subtle shadow-sm">
            <PlayerAvatar
              avatar={player1?.avatar ?? localPlayer?.avatar ?? "ember"}
              name={player1?.displayName ?? localPlayer?.displayName ?? "Host"}
              size="lg"
              connection={player1?.connection ?? "connected"}
            />
            <div className="flex flex-col items-center">
              <span className="font-semibold text-sm text-ink-primary">
                {player1?.displayName ?? localPlayer?.displayName ?? "Host"}
              </span>
              <span className="text-[11px] text-ink-tertiary">Host</span>
            </div>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                player1?.ready
                  ? "bg-[var(--success)]/15 text-[var(--success)] font-semibold"
                  : "bg-surface-sunken text-ink-tertiary"
              }`}
            >
              {player1?.ready ? "Ready" : "Not ready"}
            </span>
          </div>

          {/* Player 2 Slot */}
          <div className="flex flex-col items-center justify-center gap-3 p-5 rounded-[var(--radius-lg)] bg-surface-elevated border border-theme-subtle shadow-sm relative overflow-hidden">
            {player2 ? (
              <>
                <PlayerAvatar
                  avatar={player2.avatar}
                  name={player2.displayName}
                  size="lg"
                  connection={player2.connection}
                />
                <div className="flex flex-col items-center">
                  <span className="font-semibold text-sm text-ink-primary">
                    {player2.displayName}
                  </span>
                  <span className="text-[11px] text-ink-tertiary">Partner</span>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    player2.ready
                      ? "bg-[var(--success)]/15 text-[var(--success)] font-semibold"
                      : "bg-surface-sunken text-ink-tertiary"
                  }`}
                >
                  {player2.ready ? "Ready" : "Not ready"}
                </span>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 py-3 animate-pulse">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-theme-subtle flex items-center justify-center text-ink-tertiary">
                  <UserPlus size={24} />
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-sm font-semibold text-ink-secondary">
                    Waiting for partner
                  </span>
                  <span className="text-[11px] text-ink-tertiary">
                    Send them the code
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col gap-3 w-full max-w-md">
          {player2 ? (
            <>
              <Button
                variant={isReady ? "secondary" : "primary"}
                size="lg"
                onClick={toggleReady}
                id="lobby-ready-toggle-btn"
              >
                {isReady ? "Mark as Not Ready" : "I'm Ready"}
              </Button>

              {bothReady && (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={startGame}
                  className="!bg-[var(--success)] hover:!bg-[var(--success)]/90 animate-bounce shadow-lg"
                  id="lobby-start-game-btn"
                >
                  <Play size={18} className="mr-2" /> Start Conversation Now
                </Button>
              )}
            </>
          ) : (
            <div className="p-4 rounded-[var(--radius-sm)] bg-surface-sunken text-xs text-ink-secondary border border-theme-subtle">
              ⏳ The game will become ready once your partner enters the room.
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-2xl mx-auto w-full text-center py-4 text-xs text-ink-tertiary">
        {room?.settings?.rounds ?? 6} Rounds • {room?.settings?.intensityCeiling ?? "Balanced"} Intensity
      </footer>
    </div>
  );
}
