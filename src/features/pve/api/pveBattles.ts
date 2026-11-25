import { apiClient } from '@/src/shared/lib/api-client'

import type { AttackResponse, PveBattle } from '../types/battle'

function unwrapData<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data
  }
  return payload as T
}

function newKey(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export async function startPveBattle(ownedCreatureId: number, difficulty = 'normal'): Promise<PveBattle> {
  const payload = await apiClient.post('/api/pve/battles', {
    owned_creature_id: ownedCreatureId,
    difficulty,
  })
  return unwrapData<PveBattle>(payload)
}

export async function fetchPveBattle(battleId: string): Promise<PveBattle> {
  const payload = await apiClient.get(`/api/pve/battles/${encodeURIComponent(battleId)}`)
  return unwrapData<PveBattle>(payload)
}

export async function submitPveAttack(
  battleId: string,
  body: { move_id?: number; basic_strike?: boolean; recover?: boolean; expected_version: number },
): Promise<AttackResponse> {
  const payload = await apiClient.post(`/api/pve/battles/${encodeURIComponent(battleId)}/attack`, {
    ...body,
    idempotency_key: newKey('atk'),
  })
  return unwrapData<AttackResponse>(payload)
}

export async function submitPveDefense(
  battleId: string,
  body: { defense: string; expected_version: number },
): Promise<AttackResponse> {
  const payload = await apiClient.post(`/api/pve/battles/${encodeURIComponent(battleId)}/defend`, {
    ...body,
    idempotency_key: newKey('def'),
  })
  return unwrapData<AttackResponse>(payload)
}

export async function abandonPveBattle(battleId: string): Promise<AttackResponse> {
  const payload = await apiClient.post(`/api/pve/battles/${encodeURIComponent(battleId)}/abandon`, {})
  return unwrapData<AttackResponse>(payload)
}
