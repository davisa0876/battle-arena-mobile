import { useCallback, useEffect, useRef, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { usePathname, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useAuth } from '@/src/features/auth'
import {
  acceptPvpInvitation,
  declinePvpInvitation,
  fetchPvpRoom,
  issueRealtimeTicket,
  listPvpInvitations,
} from '@/src/features/pvp/api/pvpLobbies'
import { isPvpPresenceEligible } from '@/src/features/pvp/lib/isPvpPresenceEligible'
import { PvpRealtimeSession } from '@/src/features/pvp/lib/pvpRealtimeSession'
import type { PvpInvitation, PvpRoom } from '@/src/features/pvp/types'
import { colors } from '@/src/theme/colors'
import { spacing } from '@/src/theme/spacing'

type IncomingAlert = { kind: 'incoming'; invite: PvpInvitation }
type AcceptedAlert = { kind: 'accepted'; roomId: string; handle: string; room: PvpRoom }
type DeclinedAlert = { kind: 'declined'; invitationId: string; handle: string }
type Alert = IncomingAlert | AcceptedAlert | DeclinedAlert

function isActionableIncoming(invite: PvpInvitation): boolean {
  if (invite.status !== 'pending') {
    return false
  }
  if (invite.expires_at && new Date(invite.expires_at).getTime() <= Date.now()) {
    return false
  }
  return invite.allowed_actions.includes('accept')
}

function isImmersiveBattlePath(pathname: string | null): boolean {
  if (!pathname) {
    return false
  }
  return pathname.includes('/pvp/battles/')
}

export function PvpIncomingInviteBanner() {
  const { t } = useTranslation()
  const { status, user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const insets = useSafeAreaInsets()
  const eligible = status === 'authenticated' && isPvpPresenceEligible(user)
  const enabled = eligible && !isImmersiveBattlePath(pathname)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)
  const sessionRef = useRef<PvpRealtimeSession | null>(null)
  const pendingSentRef = useRef<Map<string, string>>(new Map())
  const primedSentRef = useRef(false)
  const dismissedDeclinedRef = useRef<Set<string>>(new Set())
  const dismissedAcceptedRef = useRef<Set<string>>(new Set())
  const declinedRef = useRef<DeclinedAlert[]>([])

  const refresh = useCallback(async () => {
    if (!enabled) {
      setAlerts([])
      return
    }
    try {
      const [received, sent] = await Promise.all([
        listPvpInvitations('received'),
        listPvpInvitations('sent'),
      ])
      const incoming: Alert[] = received.filter(isActionableIncoming).map((invite) => ({
        kind: 'incoming' as const,
        invite,
      }))
      const accepted: Alert[] = []
      for (const invite of sent.filter((item) => item.status === 'accepted' && item.room_id).slice(0, 3)) {
        if (dismissedAcceptedRef.current.has(invite.room_id)) {
          continue
        }
        try {
          const room = await fetchPvpRoom(invite.room_id)
          if (room.status === 'ready' || room.status === 'in_battle') {
            accepted.push({
              kind: 'accepted',
              roomId: room.id,
              handle: invite.invitee?.handle ?? invite.invitee?.display_name ?? 'trainer',
              room,
            })
          }
        } catch {
          // ignore closed rooms
        }
      }

      const nextPending = new Map<string, string>()
      for (const invite of sent) {
        if (invite.status === 'pending') {
          nextPending.set(
            invite.id,
            invite.invitee?.handle ?? invite.invitee?.display_name ?? 'trainer',
          )
        }
      }

      if (!primedSentRef.current) {
        pendingSentRef.current = nextPending
        primedSentRef.current = true
      } else {
        for (const [id, handle] of pendingSentRef.current) {
          if (nextPending.has(id) || dismissedDeclinedRef.current.has(id)) {
            continue
          }
          const latest = sent.find((invite) => invite.id === id)
          if (latest?.status === 'declined') {
            if (!declinedRef.current.some((alert) => alert.invitationId === id)) {
              declinedRef.current = [...declinedRef.current, { kind: 'declined', invitationId: id, handle }]
            }
          }
        }
        pendingSentRef.current = nextPending
      }

      declinedRef.current = declinedRef.current.filter(
        (alert) => !dismissedDeclinedRef.current.has(alert.invitationId),
      )

      setAlerts([...incoming, ...accepted, ...declinedRef.current])
    } catch {
      // best-effort
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) {
      setAlerts([])
      primedSentRef.current = false
      pendingSentRef.current = new Map()
      return
    }

    void refresh()
    const poll = setInterval(() => {
      void refresh()
    }, 15_000)

    const session = new PvpRealtimeSession({
      issueTicket: issueRealtimeTicket,
      issueGrant: async () => ({ grant: '' }),
      onHint: (hint) => {
        if (
          hint.type === 'pvp.invitation.changed' ||
          hint.type === 'pvp.room.changed' ||
          hint.type === 'pvp.battle.changed'
        ) {
          void refresh()
        }
      },
    })
    sessionRef.current = session
    void session.connect().catch(() => undefined)

    return () => {
      clearInterval(poll)
      session.close()
      sessionRef.current = null
    }
  }, [enabled, refresh])

  const dismissDeclined = (invitationId: string) => {
    dismissedDeclinedRef.current.add(invitationId)
    declinedRef.current = declinedRef.current.filter((alert) => alert.invitationId !== invitationId)
    setAlerts((current) =>
      current.filter((alert) => !(alert.kind === 'declined' && alert.invitationId === invitationId)),
    )
  }

  const dismissAccepted = (roomId: string) => {
    dismissedAcceptedRef.current.add(roomId)
    setAlerts((current) => current.filter((alert) => !(alert.kind === 'accepted' && alert.roomId === roomId)))
  }

  if (!enabled || alerts.length === 0) {
    return null
  }

  return (
    <View
      pointerEvents="box-none"
      style={[styles.host, { paddingTop: Math.max(insets.top, spacing.sm) }]}
      accessibilityLabel={t('pvp.alert.region')}
    >
      {alerts.map((alert) => {
        if (alert.kind === 'incoming') {
          const from = alert.invite.inviter?.handle ?? alert.invite.inviter?.display_name ?? 'trainer'
          return (
            <View key={`in-${alert.invite.id}`} style={styles.card}>
              <Text style={styles.eyebrow}>{t('pvp.alert.eyebrow')}</Text>
              <Text style={styles.body}>{t('pvp.alert.body', { handle: from })}</Text>
              <Text style={styles.hint}>{t('pvp.alert.nextStepInvitee')}</Text>
              <View style={styles.row}>
                <Pressable
                  disabled={busyId === alert.invite.id}
                  style={[styles.accept, busyId === alert.invite.id && styles.disabled]}
                  onPress={() => {
                    void (async () => {
                      setBusyId(alert.invite.id)
                      try {
                        const room = await acceptPvpInvitation(alert.invite.id)
                        await refresh()
                        // From any screen → PvP lobby focused on creature select.
                        router.push({
                          pathname: '/pvp',
                          params: { focusRoomId: room.id, fromInviteAccept: '1' },
                        })
                      } catch {
                        await refresh()
                      } finally {
                        setBusyId(null)
                      }
                    })()
                  }}
                >
                  <Text style={styles.acceptText}>{t('pvp.actions.accept')}</Text>
                </Pressable>
                <Pressable
                  disabled={busyId === alert.invite.id}
                  style={[styles.secondary, busyId === alert.invite.id && styles.disabled]}
                  onPress={() => {
                    void (async () => {
                      setBusyId(alert.invite.id)
                      try {
                        await declinePvpInvitation(alert.invite.id)
                        await refresh()
                      } catch {
                        await refresh()
                      } finally {
                        setBusyId(null)
                      }
                    })()
                  }}
                >
                  <Text style={styles.secondaryText}>{t('pvp.actions.decline')}</Text>
                </Pressable>
              </View>
            </View>
          )
        }

        if (alert.kind === 'declined') {
          return (
            <View key={`no-${alert.invitationId}`} style={[styles.card, styles.declinedCard]}>
              <Text style={styles.declinedEyebrow}>{t('pvp.alert.declinedEyebrow')}</Text>
              <Text style={styles.body}>{t('pvp.alert.declinedBody', { handle: alert.handle })}</Text>
              <Text style={styles.hint}>{t('pvp.alert.declinedNext')}</Text>
              <View style={styles.row}>
                <Pressable
                  style={styles.accept}
                  onPress={() => {
                    dismissDeclined(alert.invitationId)
                    router.push('/pvp')
                  }}
                >
                  <Text style={styles.acceptText}>{t('pvp.alert.sendAnother')}</Text>
                </Pressable>
                <Pressable style={styles.secondary} onPress={() => dismissDeclined(alert.invitationId)}>
                  <Text style={styles.secondaryText}>{t('pvp.alert.dismiss')}</Text>
                </Pressable>
              </View>
            </View>
          )
        }

        return (
          <View key={`ok-${alert.roomId}`} style={[styles.card, styles.acceptedCard]}>
            <Text style={styles.acceptedEyebrow}>{t('pvp.alert.acceptedEyebrow')}</Text>
            <Text style={styles.body}>{t('pvp.alert.acceptedBody', { handle: alert.handle })}</Text>
            <Text style={styles.hint}>{t('pvp.alert.nextStepHost')}</Text>
            <Pressable
              style={styles.accept}
              onPress={() => {
                dismissAccepted(alert.roomId)
                if (pathname === '/pvp' || pathname?.endsWith('/pvp')) {
                  return
                }
                router.push({
                  pathname: '/pvp',
                  params: { focusRoomId: alert.roomId, fromInviteAccept: '1' },
                })
              }}
            >
              <Text style={styles.acceptText}>{t('pvp.alert.chooseCreatures')}</Text>
            </Pressable>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  host: {
    left: spacing.sm,
    position: 'absolute',
    right: spacing.sm,
    top: 0,
    zIndex: 50,
  },
  card: {
    backgroundColor: 'rgba(18,24,38,0.96)',
    borderColor: 'rgba(255,101,66,0.5)',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  acceptedCard: { borderColor: 'rgba(52,211,153,0.5)' },
  declinedCard: { borderColor: 'rgba(248,113,113,0.5)' },
  eyebrow: {
    color: colors.ember,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  acceptedEyebrow: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  declinedEyebrow: {
    color: '#f87171',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  body: {
    color: colors.text,
    fontSize: 14,
    marginTop: spacing.xs,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  accept: {
    backgroundColor: colors.ember,
    borderRadius: 10,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  acceptText: { color: '#111', fontWeight: '800', textAlign: 'center' },
  secondary: {
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  secondaryText: { color: colors.text, fontWeight: '700' },
  disabled: { opacity: 0.5 },
})
