import { apiClient } from '@/src/shared/lib/api-client'

import type { OwnedCreatureListResponse, OwnedCreatureResponse } from '../types'

export function fetchMyCreatures(signal?: AbortSignal): Promise<OwnedCreatureListResponse> {
  return apiClient.get<OwnedCreatureListResponse>('/api/me/creatures', signal)
}

export function selectStarter(creatureSlug: string): Promise<OwnedCreatureResponse> {
  return apiClient.post<OwnedCreatureResponse>('/api/me/starter', { creature_slug: creatureSlug })
}

export function acquireCreature(
  creatureSlug: string,
  idempotencyKey: string,
): Promise<OwnedCreatureResponse> {
  return apiClient.post<OwnedCreatureResponse>('/api/me/creatures/acquire', {
    creature_slug: creatureSlug,
    idempotency_key: idempotencyKey,
  })
}

export function selectActiveCreature(id: number): Promise<OwnedCreatureResponse> {
  return apiClient.patch<OwnedCreatureResponse>(`/api/me/creatures/${id}/select`)
}
