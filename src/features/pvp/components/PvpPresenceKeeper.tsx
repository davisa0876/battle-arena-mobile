import { useAuth } from '@/src/features/auth'
import { usePvpPresenceSession } from '@/src/features/pvp/hooks/usePvpPresenceSession'
import { isPvpPresenceEligible } from '@/src/features/pvp/lib/isPvpPresenceEligible'

/** App-wide PvP presence for authenticated, PvP-eligible trainers. */
export function PvpPresenceKeeper() {
  const { status, user } = useAuth()
  const enabled = status === 'authenticated' && isPvpPresenceEligible(user)
  usePvpPresenceSession(enabled)
  return null
}
