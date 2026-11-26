import type { AuthUser } from '@/src/features/auth/types'

const DEFAULT_PVP_MIN_LEVEL = 6

/**
 * PvP online presence is for signed-in trainers who already meet the PvP level gate.
 * Being on the PvP lobby screen is NOT required.
 */
export function isPvpPresenceEligible(user: AuthUser | null | undefined): boolean {
  if (!user) {
    return false
  }

  const unlocked = user.trainer?.pvp_level_unlocked
  if (typeof unlocked === 'boolean') {
    return unlocked
  }

  return (user.trainer?.level ?? 1) >= DEFAULT_PVP_MIN_LEVEL
}
