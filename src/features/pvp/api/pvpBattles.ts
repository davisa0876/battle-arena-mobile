import { apiClient } from '@/src/shared/lib/api-client'
import type { PvpBattle, PvpBattleEvent, PvpLobbyCombatState } from '../types/battle'

function unwrapData<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data
  }
  return payload as T
}

export function newIdempotencyKey(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export async function selectPvpCreature(
  roomId: string,
  body: { owned_creature_id: number; expected_room_version: number },
  idempotencyKey = newIdempotencyKey('pvp-select'),
): Promise<PvpLobbyCombatState> {
  const payload = await apiClient.put(`/api/pvp/rooms/${encodeURIComponent(roomId)}/selection`, {
    ...body,
    idempotency_key: idempotencyKey,
  })
  return unwrapData(payload)
}

export async function readyPvpRoom(
  roomId: string,
  body: { expected_room_version: number },
  idempotencyKey = newIdempotencyKey('pvp-ready'),
): Promise<PvpLobbyCombatState> {
  const payload = await apiClient.post(`/api/pvp/rooms/${encodeURIComponent(roomId)}/ready`, {
    ...body,
    idempotency_key: idempotencyKey,
  })
  return unwrapData(payload)
}

export async function fetchPvpBattle(battleId: string): Promise<PvpBattle> {
  const payload = await apiClient.get(`/api/pvp/battles/${encodeURIComponent(battleId)}`)
  return unwrapData(payload)
}

export async function fetchPvpBattleEvents(battleId: string, afterSequence = 0): Promise<PvpBattleEvent[]> {
  const payload = await apiClient.get(
    `/api/pvp/battles/${encodeURIComponent(battleId)}/events?after_sequence=${afterSequence}`,
  )
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: PvpBattleEvent[] }).data
  }
  return []
}

export async function submitPvpAttack(
  battleId: string,
  body: { move_id?: number; basic_strike?: boolean; recover?: boolean; expected_version: number },
  idempotencyKey: string,
): Promise<PvpBattle> {
  const payload = await apiClient.post(`/api/pvp/battles/${encodeURIComponent(battleId)}/attack`, {
    ...body,
    idempotency_key: idempotencyKey,
  })
  const data = unwrapData<PvpBattle | { battle: PvpBattle }>(payload)
  return 'battle' in data ? data.battle : data
}

export async function submitPvpDefend(
  battleId: string,
  body: { defense: string; expected_version: number },
  idempotencyKey: string,
): Promise<{ battle: PvpBattle; rewards: PvpBattle['rewards'] }> {
  const payload = await apiClient.post(`/api/pvp/battles/${encodeURIComponent(battleId)}/defend`, {
    ...body,
    idempotency_key: idempotencyKey,
  })
  const data = unwrapData<{ battle: PvpBattle; rewards?: PvpBattle['rewards'] } | PvpBattle>(payload)
  if (data && typeof data === 'object' && 'battle' in data) {
    return { battle: data.battle, rewards: data.rewards ?? null }
  }
  return { battle: data as PvpBattle, rewards: null }
}
