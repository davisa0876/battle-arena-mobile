import type { Creature } from '@/src/features/creatures/types'

export interface EvolutionOption {
  creature: Creature
  eligible: boolean
  locked: boolean
  reason_code: string
  reason: string
}

export interface OwnedCreature {
  id: number
  level: number
  total_xp: number
  is_active: boolean
  acquired_at: string | null
  creature: Creature
  evolution?: {
    execution_enabled: boolean
    options: EvolutionOption[]
  }
}

export interface OwnedCreatureResponse {
  data: OwnedCreature
}

export interface OwnedCreatureListResponse {
  data: OwnedCreature[]
}
