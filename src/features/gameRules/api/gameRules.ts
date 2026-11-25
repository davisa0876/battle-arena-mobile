import { apiClient } from '@/src/shared/lib/api-client'

import type { GameRulesResponse } from '../types'

export function fetchGameRules(signal?: AbortSignal): Promise<GameRulesResponse> {
  return apiClient.get<GameRulesResponse>('/api/game/rules', signal, { skipAuth: true })
}
