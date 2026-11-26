import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AppState,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native'
import { Image } from 'expo-image'
import { Link, useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import {
  fetchPvpBattle,
  fetchPvpBattleEvents,
  newIdempotencyKey,
  submitPvpAttack,
  submitPvpDefend,
} from '@/src/features/pvp/api/pvpBattles'
import { issuePvpRoomGrant, issueRealtimeTicket } from '@/src/features/pvp/api/pvpLobbies'
import { attackFallback, myXp, viewerOutcome } from '@/src/features/pvp/lib/pvpActionPolicy'
import { PvpRealtimeSession } from '@/src/features/pvp/lib/pvpRealtimeSession'
import type { PvpBattle, PvpBattleEvent } from '@/src/features/pvp/types/battle'
import { ApiError } from '@/src/shared/lib/api-client'
import { toUserFacingMessage } from '@/src/shared/lib/userFacingError'
import { colors } from '@/src/theme/colors'
import { spacing } from '@/src/theme/spacing'

const ARENA_BG = require('../../../assets/pve/arena-bg.jpg')
const DEFENSES = ['endure', 'block', 'dodge', 'recover'] as const

export default function PvpBattleScreen() {
  const { battleId = '' } = useLocalSearchParams<{ battleId: string }>()
  const { t } = useTranslation()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const [battle, setBattle] = useState<PvpBattle | null>(null)
  const [events, setEvents] = useState<PvpBattleEvent[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [realtimeStatus, setRealtimeStatus] = useState('connecting')
  const battleRef = useRef<PvpBattle | null>(null)
  const pendingKeyRef = useRef<string | null>(null)
  const hydrateLock = useRef(false)

  useEffect(() => {
    battleRef.current = battle
  }, [battle])

  const hydrate = useCallback(async () => {
    if (!battleId || hydrateLock.current) return
    hydrateLock.current = true
    try {
      const next = await fetchPvpBattle(String(battleId))
      setBattle((current) => (current && next.version < current.version ? current : next))
      const page = await fetchPvpBattleEvents(String(battleId), 0)
      setEvents(page)
      setError('')
    } catch (err) {
      setError(toUserFacingMessage(err, t('pvp.errors.loadBattle')))
    } finally {
      hydrateLock.current = false
    }
  }, [battleId, t])

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  useEffect(() => {
    if (!battle?.room_id) return
    const session = new PvpRealtimeSession({
      issueTicket: issueRealtimeTicket,
      issueGrant: issuePvpRoomGrant,
      onStatus: setRealtimeStatus,
      onHint: (hint) => {
        if (hint.type === 'pvp.battle.changed') {
          if (hint.battleId && hint.battleId !== String(battleId)) return
          const current = battleRef.current
          if (current && hint.version !== undefined && hint.version <= current.version) return
          void hydrate()
        }
      },
    })
    void session
      .connect()
      .then(() => session.subscribeRoom(battle.room_id))
      .catch(() => setRealtimeStatus('error'))
    return () => session.close()
  }, [battle?.room_id, battleId, hydrate])

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void hydrate()
    })
    return () => sub.remove()
  }, [hydrate])

  useEffect(() => {
    if (!battle || battle.phase === 'finished') return
    const timer = setInterval(() => {
      if (realtimeStatus !== 'ready') void hydrate()
    }, 15_000)
    return () => clearInterval(timer)
  }, [battle, hydrate, realtimeStatus])

  const fallback = useMemo(
    () => attackFallback(battle?.me?.moves, battle?.allowed_actions ?? []),
    [battle],
  )

  const runMutation = async (fn: (key: string) => Promise<PvpBattle>) => {
    if (!battle || busy) return
    setBusy(true)
    setError('')
    const key = pendingKeyRef.current ?? newIdempotencyKey('pvp-act')
    pendingKeyRef.current = key
    try {
      const next = await fn(key)
      pendingKeyRef.current = null
      setBattle(next)
      await hydrate()
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        pendingKeyRef.current = null
        setError(toUserFacingMessage(err, t('pvp.errors.stale')))
      } else {
        if (err instanceof ApiError && [422, 403, 404].includes(err.status ?? 0)) {
          pendingKeyRef.current = null
        }
        setError(toUserFacingMessage(err, t('pvp.errors.actionFailed')))
      }
      await hydrate()
    } finally {
      setBusy(false)
    }
  }

  if (!battle) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.error}>{error || t('pvp.battle.loading')}</Text>
        <Link href="/pvp" asChild>
          <Pressable style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>{t('pvp.battle.backLobby')}</Text>
          </Pressable>
        </Link>
      </View>
    )
  }

  const outcome = viewerOutcome(battle)
  const xp = myXp(battle)
  const defending = battle.allowed_actions.some((a) => DEFENSES.includes(a as (typeof DEFENSES)[number]))
  const attacking =
    battle.phase === 'awaiting_attack' &&
    (fallback.canAttackMove || fallback.canBasicStrike || fallback.canRecoverSkip)
  const spriteSize = Math.min(140, width * 0.34)

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl }}
    >
      <Text style={styles.eyebrow}>{t('pvp.eyebrow')}</Text>
      <Text style={styles.title}>{t('pvp.battle.title')}</Text>
      <Text style={styles.meta}>
        {t('pvp.battle.phase', { phase: battle.phase })} · {t('pvp.battle.turn', { turn: battle.turn_number })} ·{' '}
        {t('pvp.realtime.status', { status: realtimeStatus })}
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {battle.pending_attack && defending ? (
        <Text style={styles.pending}>
          {t('pvp.battle.pendingAttack', {
            move:
              battle.pending_attack.move_name ??
              (battle.pending_attack.is_basic_strike ? t('pvp.battle.basicStrike') : '—'),
          })}
        </Text>
      ) : null}

      <View style={styles.arena}>
        <Image source={ARENA_BG} style={StyleSheet.absoluteFillObject} contentFit="cover" />
        <View style={styles.hudRow}>
          <Hud combatant={battle.opponent} label="opponent" />
          <Hud combatant={battle.me} label="me" />
        </View>
        <View style={styles.spriteRow}>
          <Image
            source={{ uri: battle.opponent?.image_ref ?? undefined }}
            style={{ width: spriteSize, height: spriteSize, opacity: (battle.opponent?.hp.current ?? 0) <= 0 ? 0.4 : 1 }}
            contentFit="contain"
          />
          <Image
            source={{ uri: battle.me?.image_ref ?? undefined }}
            style={{ width: spriteSize * 1.1, height: spriteSize * 1.1, opacity: (battle.me?.hp.current ?? 0) <= 0 ? 0.4 : 1 }}
            contentFit="contain"
          />
        </View>
      </View>

      <View style={styles.log}>
        <Text style={styles.logTitle}>Combat log</Text>
        {events.length === 0 ? (
          <Text style={styles.meta}>{t('pvp.battle.waitingOpponent')}</Text>
        ) : (
          [...events]
            .reverse()
            .slice(0, 40)
            .map((event) => (
              <Text key={`${event.sequence}-${event.type}`} style={styles.logLine}>
                #{event.sequence} {event.type}
              </Text>
            ))
        )}
      </View>

      {battle.phase === 'finished' ? (
        <View style={styles.result}>
          <Text style={styles.title}>
            {outcome === 'win' ? t('pvp.battle.win') : outcome === 'loss' ? t('pvp.battle.loss') : t('pvp.battle.title')}
          </Text>
          {typeof xp === 'number' ? <Text style={styles.xp}>{t('pvp.battle.xp', { xp })}</Text> : null}
          <Pressable style={styles.primaryButton} onPress={() => router.push('/pvp')}>
            <Text style={styles.primaryButtonText}>{t('pvp.battle.backLobby')}</Text>
          </Pressable>
        </View>
      ) : attacking ? (
        <View style={styles.dock}>
          {(battle.me?.moves ?? [])
            .filter((m) => m.can_use && m.id != null)
            .map((move) => (
              <Pressable
                key={move.id}
                disabled={busy}
                style={styles.primaryButton}
                onPress={() =>
                  void runMutation((key) =>
                    submitPvpAttack(battle.id, { move_id: move.id!, expected_version: battle.version }, key),
                  )
                }
              >
                <Text style={styles.primaryButtonText}>
                  {move.name} ({move.pp.current}/{move.pp.max})
                </Text>
              </Pressable>
            ))}
          {fallback.canBasicStrike ? (
            <Pressable
              disabled={busy}
              style={styles.primaryButton}
              onPress={() =>
                void runMutation((key) =>
                  submitPvpAttack(battle.id, { basic_strike: true, expected_version: battle.version }, key),
                )
              }
            >
              <Text style={styles.primaryButtonText}>{t('pvp.battle.basicStrike')}</Text>
            </Pressable>
          ) : null}
          {fallback.canRecoverSkip ? (
            <Pressable
              disabled={busy}
              style={styles.secondaryButton}
              onPress={() =>
                void runMutation((key) =>
                  submitPvpAttack(battle.id, { recover: true, expected_version: battle.version }, key),
                )
              }
            >
              <Text style={styles.secondaryButtonText}>{t('pvp.battle.recover')}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : defending ? (
        <View style={styles.dock}>
          {DEFENSES.filter((d) => battle.allowed_actions.includes(d)).map((defense) => (
            <Pressable
              key={defense}
              disabled={busy}
              style={styles.primaryButton}
              onPress={() =>
                void runMutation(async (key) => {
                  const result = await submitPvpDefend(
                    battle.id,
                    { defense, expected_version: battle.version },
                    key,
                  )
                  return result.rewards
                    ? { ...result.battle, rewards: result.rewards }
                    : result.battle
                })
              }
            >
              <Text style={styles.primaryButtonText}>{defense}</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <Text style={styles.meta}>{t('pvp.battle.waitingOpponent')}</Text>
      )}

      <Pressable style={[styles.secondaryButton, { marginTop: spacing.md }]} onPress={() => void hydrate()} disabled={busy}>
        <Text style={styles.secondaryButtonText}>{t('pvp.actions.refresh')}</Text>
      </Pressable>
    </ScrollView>
  )
}

function Hud({
  combatant,
  label,
}: {
  combatant: PvpBattle['me']
  label: string
}) {
  if (!combatant) return <View style={styles.hudCard} />
  return (
    <View style={styles.hudCard}>
      <Text style={styles.hudLabel}>{label}</Text>
      <Text style={styles.hudName}>{combatant.name}</Text>
      <Text style={styles.hudStats}>
        HP {combatant.hp.current}/{combatant.hp.max} · STA {combatant.stamina.current}/{combatant.stamina.max}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.md },
  eyebrow: { color: colors.ember, fontSize: 11, fontWeight: '800', letterSpacing: 1.4, textTransform: 'uppercase' },
  title: { color: colors.text, fontSize: 28, fontWeight: '700', marginTop: spacing.xs },
  meta: { color: colors.textMuted, marginTop: spacing.xs, fontSize: 13 },
  error: { color: colors.danger, marginTop: spacing.sm },
  pending: { color: colors.electric ?? '#27c9ec', marginTop: spacing.sm },
  arena: {
    marginTop: spacing.md,
    height: 260,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  hudRow: { flexDirection: 'row', justifyContent: 'space-between', padding: spacing.sm, gap: spacing.sm },
  hudCard: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 12, padding: spacing.sm },
  hudLabel: { color: colors.textMuted, fontSize: 10, textTransform: 'uppercase' },
  hudName: { color: colors.text, fontWeight: '700' },
  hudStats: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  spriteRow: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  log: {
    marginTop: spacing.md,
    maxHeight: 180,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#070d18',
    padding: spacing.md,
  },
  logTitle: { color: colors.text, fontWeight: '700', marginBottom: spacing.xs },
  logLine: { color: colors.textMuted, fontFamily: 'monospace', fontSize: 12, marginBottom: 4 },
  dock: { marginTop: spacing.md, gap: spacing.sm },
  result: { marginTop: spacing.md, gap: spacing.sm },
  xp: { color: '#fbbf24', fontWeight: '700' },
  primaryButton: { backgroundColor: colors.ember, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14 },
  primaryButtonText: { color: '#000', fontWeight: '700', textAlign: 'center' },
  secondaryButton: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14 },
  secondaryButtonText: { color: colors.text, textAlign: 'center' },
})
