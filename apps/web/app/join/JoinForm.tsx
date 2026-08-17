"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, LogIn } from "lucide-react";
import type { AvatarId, RelationshipType } from "@twilight/shared-types";
import { useGameStore } from "@/lib/state/gameStore";
import { Button } from "@/components/ui/Button";
import { PlayerAvatar, AVATAR_IDS } from "@/components/ui/PlayerAvatar";
import { ToastContainer } from "@/components/ui/Toast";

function JoinFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get("token") || "";
  const codeParam = searchParams.get("code") || "";

  const { joinRoom, room, setLocalPlayer, toasts, removeToast } = useGameStore();

  const [roomCode, setRoomCode] = useState(codeParam.toUpperCase());
  const [displayName, setDisplayName] = useState("");
  const [avatar, setAvatar] = useState<AvatarId>("sage");
  const [relationshipType, setRelationshipType] = useState<RelationshipType>("friends");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (codeParam) setRoomCode(codeParam.toUpperCase());
  }, [codeParam]);

  useEffect(() => {
    if (room && room.roomId) router.push(`/room/${room.roomId}/lobby`);
  }, [room, router]);

  const handleJoin = () => {
    if (!displayName.trim()) return;
    if (!tokenParam && roomCode.length < 6) return;
    setIsSubmitting(true);
    setLocalPlayer({ id: "guest", displayName: displayName.trim(), avatar, relationshipType });
    joinRoom(displayName.trim(), avatar, roomCode.trim() || undefined, tokenParam || undefined, relationshipType);
  };

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Room Code */}
      {!tokenParam && (
        <div className="flex flex-col gap-2">
          <label htmlFor="room-code-input" className="text-sm font-semibold text-[var(--ink-primary)]">
            6-Character Room Code
          </label>
          <input
            id="room-code-input"
            type="text"
            maxLength={6}
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="e.g. 7X9K2M"
            className="w-full px-4 py-3 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-[var(--accent-ember)] outline-none text-xl font-mono tracking-widest text-center uppercase transition-colors"
            autoFocus={!codeParam}
          />
        </div>
      )}

      {/* Display Name */}
      <div className="flex flex-col gap-2">
        <label htmlFor="join-name-input" className="text-sm font-semibold text-[var(--ink-primary)]">
          Your Display Name
        </label>
        <input
          id="join-name-input"
          type="text"
          maxLength={24}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="e.g. Robin, Sam, Taylor"
          className="w-full px-4 py-3 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-[var(--accent-ember)] outline-none text-base transition-colors"
          autoFocus={!!codeParam || !!tokenParam}
        />
      </div>

      {/* Avatar Picker */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-semibold text-[var(--ink-primary)]">Choose an Avatar</label>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3" role="radiogroup">
          {AVATAR_IDS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAvatar(a)}
              className={`flex flex-col items-center justify-center p-2 rounded-[var(--radius-md)] transition-transform ${
                avatar === a
                  ? "ring-2 ring-[var(--accent-ember)] ring-offset-2 scale-110 bg-[var(--bg-elevated)]"
                  : "hover:scale-105 opacity-80 hover:opacity-100"
              }`}
              aria-checked={avatar === a}
              role="radio"
            >
              <PlayerAvatar avatar={a} name={displayName || "You"} size="sm" />
              <span className="text-[10px] text-[var(--ink-tertiary)] mt-1 capitalize">{a}</span>
            </button>
          ))}
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        disabled={!displayName.trim() || (!tokenParam && roomCode.length < 6)}
        onClick={handleJoin}
        loading={isSubmitting}
        id="join-room-btn"
      >
        <LogIn size={16} className="mr-2" /> Join Conversation
      </Button>
    </>
  );
}

export function JoinForm() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-8 animate-pulse">
          {/* Room code skeleton */}
          <div className="flex flex-col gap-2">
            <div className="h-4 w-40 bg-[var(--bg-elevated)] rounded" />
            <div className="h-12 w-full bg-[var(--bg-elevated)] rounded-[var(--radius-sm)]" />
          </div>
          {/* Name skeleton */}
          <div className="flex flex-col gap-2">
            <div className="h-4 w-32 bg-[var(--bg-elevated)] rounded" />
            <div className="h-12 w-full bg-[var(--bg-elevated)] rounded-[var(--radius-sm)]" />
          </div>
          {/* Avatar skeleton */}
          <div className="flex flex-col gap-3">
            <div className="h-4 w-28 bg-[var(--bg-elevated)] rounded" />
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-14 w-full bg-[var(--bg-elevated)] rounded-[var(--radius-md)]" />
              ))}
            </div>
          </div>
          {/* Button skeleton */}
          <div className="h-12 w-full bg-[var(--bg-elevated)] rounded-[var(--radius-sm)]" />
        </div>
      }
    >
      <JoinFormInner />
    </Suspense>
  );
}
