/** Selection quota for one creature evolution stage (owner-only, computed by the server). */
export interface SelectionAllowance {
  /** Original creature evolution_stage the quota applies to (not trainer level). */
  evolution_stage: number
  total: number
  used: number
  remaining: number
}

export interface TrainerProgress {
  /** Trainer (account) level. Distinct from creature evolution_stage and owned-creature level. */
  level: number
  total_xp: number
  xp_into_level: number
  xp_for_next_level: number | null
  xp_to_next_level: number | null
  progress_percent: number
  is_max_level: boolean
  /** Owner-only; absent on public profiles. */
  selection_allowances?: SelectionAllowance[]
  /** Owner-only; whether trainer level meets the server's PvP minimum. */
  pvp_level_unlocked?: boolean
}

export interface AuthProfile {
  handle: string
  display_name: string
  bio: string | null
  avatar_url: string | null
  collection_is_public: boolean
}

export interface PveRecord {
  wins: number
  losses: number
  give_ups: number
}

export interface PvpRecord {
  wins: number
  losses: number
  forfeits: number
}

export interface AuthUser {
  id: number
  email: string
  email_verified: boolean
  email_verified_at: string | null
  profile: AuthProfile | null
  trainer: TrainerProgress | null
  /** Career PvE totals from /api/me. */
  pve_record?: PveRecord
  /** Career private PvP totals from /api/me. */
  pvp_record?: PvpRecord
  onboarding: {
    starter_selected: boolean
  }
  created_at: string | null
}

export interface AuthUserResponse {
  data: AuthUser
}

export interface AuthSessionResponse extends AuthUserResponse {
  meta: {
    auth_mode: 'token' | 'session'
    token?: string
    token_type?: string
  }
}

export interface MessageResponse {
  message: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  password: string
  password_confirmation: string
  handle: string
  display_name?: string
}

export interface ResetPasswordPayload {
  token: string
  email: string
  password: string
  password_confirmation: string
}
