import { useEffect, useRef } from 'react'

import { issueRealtimeTicket } from '@/src/features/pvp/api/pvpLobbies'
import { PvpRealtimeSession } from '@/src/features/pvp/lib/pvpRealtimeSession'

/** Keeps a WS open so the realtime gateway marks this trainer online app-wide. */
export function usePvpPresenceSession(enabled: boolean): void {
  const sessionRef = useRef<PvpRealtimeSession | null>(null)

  useEffect(() => {
    if (!enabled) {
      sessionRef.current?.close()
      sessionRef.current = null
      return
    }

    const session = new PvpRealtimeSession({
      issueTicket: issueRealtimeTicket,
      issueGrant: async () => ({ grant: '' }),
      onHint: () => undefined,
    })
    sessionRef.current = session
    void session.connect().catch(() => undefined)

    return () => {
      session.close()
      if (sessionRef.current === session) {
        sessionRef.current = null
      }
    }
  }, [enabled])
}
