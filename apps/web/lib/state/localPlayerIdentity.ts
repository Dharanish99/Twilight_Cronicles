import type { AvatarId, PlayerState, RelationshipType } from "@twilight/shared-types";

export interface LocalPlayerIdentity {
  id: string;
  displayName: string;
  avatar: AvatarId;
  relationshipType?: RelationshipType;
  sessionToken?: string;
  roomId?: string;
}

export function mergeLocalPlayerIdentity(
  current: LocalPlayerIdentity | null,
  identity: { playerId: string; sessionToken: string; roomId: string },
): LocalPlayerIdentity {
  return {
    ...(current ?? { id: identity.playerId, displayName: "Player", avatar: "sage" as AvatarId }),
    id: identity.playerId,
    sessionToken: identity.sessionToken,
    roomId: identity.roomId,
  };
}

export function hydrateLocalPlayerProfile(
  current: LocalPlayerIdentity | null,
  player: PlayerState | undefined,
): LocalPlayerIdentity | null {
  if (!current || !player) return current;
  return {
    ...current,
    id: player.id,
    displayName: player.displayName,
    avatar: player.avatar,
    ...(player.relationshipTypeShared ? { relationshipType: player.relationshipTypeShared } : {}),
  };
}
