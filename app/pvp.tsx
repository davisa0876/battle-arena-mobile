import { router } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useTranslation } from 'react-i18next'

import { RequireAuth } from '@/src/features/auth'
import {
  acceptPvpInvitation,
  cancelPvpInvitation,
  createPvpRoom,
  declinePvpInvitation,
  fetchPvpRoom,
  issuePvpRoomGrant,
  issueRealtimeTicket,
  leavePvpRoom,
  listPvpInvitations,
} from '@/src/features/pvp/api/pvpLobbies'
import { PvpRealtimeSession } from '@/src/features/pvp/lib/pvpRealtimeSession'
import type { PvpInvitation, PvpRoom } from '@/src/features/pvp/types'
import { Screen } from '@/src/shared/components/Screen'
import { toUserFacingMessage } from '@/src/shared/lib/userFacingError'
import { colors } from '@/src/theme/colors'
import { spacing } from '@/src/theme/spacing'

export default function PvpLobbyScreen() {
  const { t } = useTranslation()
  const [handle, setHandle] = useState('')
  const [received, setReceived] = useState<PvpInvitation[]>([])
  const [sent, setSent] = useState<PvpInvitation[]>([])
  const [room, setRoom] = useState<PvpRoom | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'ready' | 'closed' | 'error'>('connecting')
  const roomRef = useRef<PvpRoom | null>(null)
  const sessionRef = useRef<PvpRealtimeSession | null>(null)

  useEffect(() => {
    roomRef.current = room
  }, [room])

  const refresh = useCallback(async () => {
    const [inbox, outbox] = await Promise.all([
      listPvpInvitations('received'),
      listPvpInvitations('sent'),
    ])
    setReceived(inbox)
    setSent(outbox)
  }, [])

  const rehydrateRoom = useCallback(async (roomId: string) => {
    try {
      const next = await fetchPvpRoom(roomId)
      setRoom(next.status === 'closed' ? null : next)
      if (next.status !== 'closed' && sessionRef.current) {
        await sessionRef.current.subscribeRoom(next.id)
      }
    } catch {
      setRoom(null)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        await refresh()
      } catch (err) {
        if (!cancelled) {
          setError(toUserFacingMessage(err, t('pvp.errors.loadFailed')))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [refresh, t])

  useEffect(() => {
    const session = new PvpRealtimeSession({
      issueTicket: issueRealtimeTicket,
      issueGrant: issuePvpRoomGrant,
      onStatus: setRealtimeStatus,
      onHint: (hint) => {
        void (async () => {
          try {
            if (hint.type === 'pvp.invitation.changed') {
              await refresh()
              return
            }
            if (hint.type === 'room.subscription.revoked') {
              setRoom(null)
              await refresh()
              return
            }
            if (hint.type === 'pvp.room.changed' && hint.roomId) {
              const current = roomRef.current
              if (current && hint.version !== undefined && hint.version <= current.version) {
                return
              }
              await rehydrateRoom(hint.roomId)
              await refresh()
            }
          } catch {
            // REST remains source of truth on next action.
          }
        })()
      },
    })
    sessionRef.current = session
    void session.connect().catch(() => setRealtimeStatus('error'))
    return () => {
      session.close()
      sessionRef.current = null
    }
  }, [refresh, rehydrateRoom])

  useEffect(() => {
    if (!room || realtimeStatus !== 'ready' || !sessionRef.current) {
      return
    }
    void sessionRef.current.subscribeRoom(room.id).catch(() => undefined)
  }, [room, realtimeStatus])

  async function onCreate() {
    setBusy(true)
    setError('')
    try {
      const result = await createPvpRoom(handle.trim())
      setRoom(result.room)
      setHandle('')
      await refresh()
    } catch (err) {
      setError(toUserFacingMessage(err, t('pvp.errors.createFailed')))
    } finally {
      setBusy(false)
    }
  }

  async function runAction(action: () => Promise<void>) {
    setBusy(true)
    setError('')
    try {
      await action()
    } catch (err) {
      setError(toUserFacingMessage(err, t('pvp.errors.actionFailed')))
    } finally {
      setBusy(false)
    }
  }

  return (
    <RequireAuth>
      <Screen>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>{t('navigation.back')}</Text>
        </Pressable>

        <Text style={styles.eyebrow}>{t('pvp.eyebrow')}</Text>
        <Text style={styles.title}>{t('pvp.title')}</Text>
        <Text style={styles.subtitle}>{t('pvp.subtitle')}</Text>
        <Text style={styles.phaseNote}>{t('pvp.phaseNote')}</Text>
        <Text style={styles.realtime}>{t('pvp.realtime.status', { status: realtimeStatus })}</Text>

        {loading ? <ActivityIndicator color={colors.ember} style={{ marginTop: spacing.xl }} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.label}>{t('pvp.form.handleLabel')}</Text>
        <TextInput
          value={handle}
          onChangeText={setHandle}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!busy}
          placeholder={t('pvp.form.handlePlaceholder')}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
        <Pressable
          disabled={busy || handle.trim().length < 3}
          onPress={() => void onCreate()}
          style={({ pressed }) => [styles.primaryButton, (busy || handle.trim().length < 3) && styles.disabled, pressed && styles.pressed]}
        >
          <Text style={styles.primaryButtonText}>{t('pvp.form.submit')}</Text>
        </Pressable>

        <Text style={styles.section}>{t('pvp.inbox.received')}</Text>
        {received.length === 0 ? <Text style={styles.empty}>{t('pvp.inbox.emptyReceived')}</Text> : null}
        {received.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.cardTitle}>
              {item.inviter?.handle} → {item.invitee?.handle}
            </Text>
            <Text style={styles.meta}>{item.status}</Text>
            <View style={styles.row}>
              {item.allowed_actions.includes('accept') ? (
                <Pressable
                  disabled={busy}
                  onPress={() =>
                    void runAction(async () => {
                      setRoom(await acceptPvpInvitation(item.id))
                      await refresh()
                    })
                  }
                  style={styles.primaryButton}
                >
                  <Text style={styles.primaryButtonText}>{t('pvp.actions.accept')}</Text>
                </Pressable>
              ) : null}
              {item.allowed_actions.includes('decline') ? (
                <Pressable
                  disabled={busy}
                  onPress={() =>
                    void runAction(async () => {
                      await declinePvpInvitation(item.id)
                      await refresh()
                    })
                  }
                  style={styles.secondaryButton}
                >
                  <Text style={styles.secondaryButtonText}>{t('pvp.actions.decline')}</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ))}

        <Text style={styles.section}>{t('pvp.inbox.sent')}</Text>
        {sent.length === 0 ? <Text style={styles.empty}>{t('pvp.inbox.emptySent')}</Text> : null}
        {sent.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.cardTitle}>
              {item.inviter?.handle} → {item.invitee?.handle}
            </Text>
            <Text style={styles.meta}>{item.status}</Text>
            {item.allowed_actions.includes('cancel') ? (
              <Pressable
                disabled={busy}
                onPress={() =>
                  void runAction(async () => {
                    await cancelPvpInvitation(item.id)
                    setRoom(null)
                    await refresh()
                  })
                }
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>{t('pvp.actions.cancel')}</Text>
              </Pressable>
            ) : null}
          </View>
        ))}

        {room ? (
          <View style={styles.card}>
            <Text style={styles.section}>{t('pvp.lobby.title')}</Text>
            <Text style={styles.meta}>{t('pvp.lobby.status', { status: room.status })} · v{room.version}</Text>
            {room.members.map((member) => (
              <Text key={`${member.user_id}-${member.role}`} style={styles.cardTitle}>
                {member.player?.display_name ?? member.player?.handle ?? member.user_id} ({member.role})
              </Text>
            ))}
            <View style={styles.row}>
              <Pressable
                disabled={busy}
                onPress={() => void runAction(async () => rehydrateRoom(room.id))}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>{t('pvp.actions.refresh')}</Text>
              </Pressable>
              {room.allowed_actions.includes('leave') ? (
                <Pressable
                  disabled={busy}
                  onPress={() =>
                    void runAction(async () => {
                      await leavePvpRoom(room.id)
                      setRoom(null)
                      await refresh()
                    })
                  }
                  style={styles.primaryButton}
                >
                  <Text style={styles.primaryButtonText}>{t('pvp.actions.leave')}</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ) : null}
      </Screen>
    </RequireAuth>
  )
}

const styles = StyleSheet.create({
  back: { marginBottom: spacing.md },
  backText: { color: colors.electric, fontWeight: '700' },
  eyebrow: {
    color: colors.ember,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: { color: colors.text, fontSize: 32, fontWeight: '800', marginTop: spacing.sm },
  subtitle: { color: colors.textMuted, fontSize: 15, lineHeight: 22, marginTop: spacing.sm },
  phaseNote: { color: colors.textMuted, fontSize: 13, marginTop: spacing.xs },
  realtime: { color: colors.gold, fontSize: 12, marginTop: spacing.sm },
  error: {
    backgroundColor: 'rgba(255,101,66,0.12)',
    borderColor: colors.ember,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.ember,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  label: { color: colors.text, fontSize: 14, fontWeight: '600', marginTop: spacing.xl },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.text,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.ember,
    borderRadius: 12,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  primaryButtonText: { color: '#111', fontWeight: '800', textAlign: 'center' },
  secondaryButton: {
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  secondaryButtonText: { color: colors.text, fontWeight: '700', textAlign: 'center' },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  section: { color: colors.text, fontSize: 18, fontWeight: '700', marginTop: spacing.xl },
  empty: { color: colors.textMuted, marginTop: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  cardTitle: { color: colors.text, fontWeight: '700' },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: spacing.xs },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
})
