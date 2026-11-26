import type { PvpRoom } from '@/src/features/pvp/types'

/** Prefer a ready/in_battle lobby for creature select after accept-from-anywhere. */
export function findReadyLobbyRoomId(lobby: PvpRoom | null | undefined): string | null {
  if (!lobby) {
    return null
  }
  if (lobby.status === 'ready' || lobby.status === 'in_battle') {
    return lobby.id
  }
  return null
}
