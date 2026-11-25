import type { OwnedCreature } from '@/src/features/collection/types'
import type { TrainerProgress } from '@/src/features/auth/types'

export interface PublicPlayer {
  handle: string
  display_name: string
  bio: string | null
  avatar_url: string | null
  collection_is_public: boolean
  trainer: TrainerProgress | null
  /** Only present when the player made their collection public. */
  creatures?: OwnedCreature[]
}

export interface PublicPlayerResponse {
  data: PublicPlayer
}

export interface UpdateProfilePayload {
  handle?: string
  display_name?: string
  bio?: string | null
  collection_is_public?: boolean
}
