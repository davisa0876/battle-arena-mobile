import { router } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Image, ImageBackground, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'

const arenaBackground = require('../assets/pve/arena-bg.jpg')
const winFireworks = require('../assets/pve/fireworks.gif')

const ATTACK_TONES = [
  { box: { backgroundColor: 'rgba(255,101,66,0.14)', borderColor: 'rgba(255,101,66,0.55)' }, title: { color: '#FF8A6E' } },
  { box: { backgroundColor: 'rgba(255,184,77,0.14)', borderColor: 'rgba(255,184,77,0.55)' }, title: { color: '#FFB84D' } },
  { box: { backgroundColor: 'rgba(251,113,133,0.14)', borderColor: 'rgba(251,113,133,0.55)' }, title: { color: '#FB7185' } },
  { box: { backgroundColor: 'rgba(57,255,20,0.12)', borderColor: 'rgba(57,255,20,0.5)' }, title: { color: '#39FF14' } },
] as const

const DEFENSE_TONES = {
  endure: {
    box: { backgroundColor: 'rgba(158,168,186,0.14)', borderColor: 'rgba(158,168,186,0.5)' },
    title: { color: '#D6DEEA' },
  },
  block: {
    box: { backgroundColor: 'rgba(39,201,236,0.16)', borderColor: 'rgba(39,201,236,0.6)' },
    title: { color: '#27C9EC' },
  },
  dodge: {
    box: { backgroundColor: 'rgba(255,184,77,0.16)', borderColor: 'rgba(255,184,77,0.6)' },
    title: { color: '#FFB84D' },
  },
  recover: {
    box: { backgroundColor: 'rgba(52,211,153,0.16)', borderColor: 'rgba(52,211,153,0.6)' },
    title: { color: '#34D399' },
  },
} as const

import { RequireAuth, useAuth } from '@/src/features/auth'
import { fetchMyCreatures } from '@/src/features/collection/api/collection'
import type { OwnedCreature } from '@/src/features/collection/types/collection'
import { CreatureImage } from '@/src/features/creatures/components/CreatureImage'
import {
  abandonPveBattle,
  startPveBattle,
  submitPveAttack,
  submitPveDefense,
} from '@/src/features/pve/api/pveBattles'
import {
  initialIntroState,
  runBattleIntro,
  type BattleIntroState,
} from '@/src/features/pve/lib/battleIntroController'
import type { CombatLogEntry, PveBattle, PveRecord } from '@/src/features/pve/types/battle'
import { Screen } from '@/src/shared/components/Screen'
import { getBattleBgmManager } from '@/src/shared/lib/audio/battleBgmManager'
import { playAttackSfx, playOutcomeSfx } from '@/src/shared/lib/audio/battleSfx'
import { toUserFacingMessage } from '@/src/shared/lib/userFacingError'
import { getCryAudioManager } from '@/src/shared/lib/audio/cryAudioManager'
import { colors } from '@/src/theme/colors'
import { spacing } from '@/src/theme/spacing'

function MiniBar({
  label,
  current,
  max,
  tone,
}: {
  label: string
  current: number
  max: number
  tone: 'hp' | 'stamina'
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0
  return (
    <View style={styles.barBlock}>
      <View style={styles.barLabelRow}>
        <Text style={styles.barLabel}>{label}</Text>
        <Text style={styles.barLabel}>
          {current}/{max}
        </Text>
      </View>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            {
              width: `${pct}%`,
              backgroundColor: tone === 'hp' ? (pct <= 25 ? colors.danger : '#34D399') : colors.electric,
            },
          ]}
        />
      </View>
    </View>
  )
}

function RecordSummary({
  record,
  t,
}: {
  record?: PveRecord | null
  t: TFunction
}) {
  if (!record) return null
  return (
    <View style={styles.recordRow}>
      <Text style={[styles.recordChip, styles.recordWin]}>
        {t('pve.record.wins', { count: record.wins })}
      </Text>
      <Text style={[styles.recordChip, styles.recordLoss]}>
        {t('pve.record.losses', { count: record.losses })}
      </Text>
      <Text style={[styles.recordChip, styles.recordGiveUp]}>
        {t('pve.record.giveUps', { count: record.give_ups })}
      </Text>
    </View>
  )
}

function CombatLog({ entries, t }: { entries: CombatLogEntry[]; t: TFunction }) {
  const latest = [...entries].reverse()
  if (latest.length === 0) {
    return <Text style={styles.logEmpty}>{t('pve.log.empty')}</Text>
  }

  return (
    <ScrollView style={styles.logScroll} contentContainerStyle={styles.logList} nestedScrollEnabled>
      {latest.map((entry) => {
        if (entry.kind === 'started') {
          return (
            <Text key={entry.id} style={styles.logLine}>
              {t('pve.log.started')}
            </Text>
          )
        }
        if (entry.kind === 'finished') {
          return (
            <Text key={entry.id} style={styles.logWin}>
              {entry.outcome === 'win' ? t('pve.result.win') : t('pve.result.loss')}
              {typeof entry.xp_awarded === 'number' ? ` ${t('pve.result.xp', { xp: entry.xp_awarded })}` : ''}
            </Text>
          )
        }

        if (entry.kind === 'recover_skip') {
          return (
            <View key={entry.id} style={styles.logCard}>
              <Text style={styles.logRound}>{t('pve.log.round', { round: entry.round })}</Text>
              <Text style={styles.logStrong}>
                {t('pve.log.recoverSkip', { name: entry.actor.name, stamina: entry.stamina_gained })}
              </Text>
            </View>
          )
        }

        const reduction =
          entry.defense?.multiplier != null ? Math.round((1 - entry.defense.multiplier) * 100) : null

        return (
          <View key={entry.id} style={styles.logCard}>
            <Text style={styles.logRound}>{t('pve.log.round', { round: entry.round })}</Text>
            <Text style={styles.logLine}>
              {t('pve.log.attacker')} <Text style={styles.logStrong}>{entry.attacker.name}</Text>
            </Text>
            <Text style={styles.logLine}>
              {t('pve.log.defender')} <Text style={styles.logStrong}>{entry.defender.name}</Text>
            </Text>
            <Text style={styles.logStrong}>
              {t('pve.log.usedAttack', { name: entry.attacker.name, attack: entry.attack.name })}
            </Text>
            <Text style={styles.logLine}>
              {t('pve.log.attackCost', {
                stamina: entry.attack.stamina_spent,
                pp: entry.attack.pp_spent,
              })}
            </Text>
            {entry.defense ? (
              <Text style={styles.logLine}>
                {t('pve.log.usedDefense', {
                  name: entry.defender.name,
                  defense: t(`pve.defense.${entry.defense.type}.label`, {
                    defaultValue: entry.defense.type,
                  }),
                })}
                {reduction != null && reduction > 0
                  ? ` ${t('pve.log.damageReduced', { percent: reduction })}`
                  : ''}
              </Text>
            ) : null}
            {entry.result?.hit === 'miss' ? <Text style={styles.logLine}>{t('pve.log.missed')}</Text> : null}
            {entry.result?.hit === 'dodged' ? <Text style={styles.logLine}>{t('pve.log.dodged')}</Text> : null}
            {entry.result &&
            (entry.result.hit === 'hit' || entry.result.hit === 'blocked' || entry.result.hit === 'immune') ? (
              <Text style={styles.logDamage}>
                {t('pve.log.damage', { damage: entry.result.damage })}
                {entry.result.hp_before != null && entry.result.hp_after != null
                  ? ` ${t('pve.log.hpRemaining', {
                      name: entry.defender.name,
                      before: entry.result.hp_before,
                      after: entry.result.hp_after,
                    })}`
                  : ''}
              </Text>
            ) : null}
            {entry.fainted ? (
              <Text style={styles.logOk}>{t('pve.log.fainted', { name: entry.fainted })}</Text>
            ) : null}
          </View>
        )
      })}
    </ScrollView>
  )
}

export default function PveScreen() {
  const { t } = useTranslation()
  const { status, user, refreshUser } = useAuth()
  const [creatures, setCreatures] = useState<OwnedCreature[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [battle, setBattle] = useState<PveBattle | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [intro, setIntro] = useState<BattleIntroState>(() => initialIntroState(true))
  const [soundOn, setSoundOn] = useState(true)
  const [musicOn, setMusicOn] = useState(true)
  const [selectedMoveId, setSelectedMoveId] = useState<number | 'basic' | 'recover' | null>(null)
  const [selectedDefense, setSelectedDefense] = useState<'endure' | 'block' | 'dodge' | 'recover'>('endure')
  const cancelledRef = useRef(false)
  const introBattleId = useRef<string | null>(null)

  const loadCollection = useCallback(async () => {
    try {
      const [response] = await Promise.all([fetchMyCreatures(), refreshUser().catch(() => null)])
      const list = response.data
      setCreatures(list)
      setSelectedId(list.find((item) => item.is_active)?.id ?? list[0]?.id ?? null)
    } catch (caught) {
      setError(toUserFacingMessage(caught, t('pve.errors.loadCollection')))
    }
  }, [refreshUser, t])

  useEffect(() => {
    if (status === 'authenticated') {
      void loadCollection()
    }
  }, [loadCollection, status])

  useEffect(() => {
    return () => {
      cancelledRef.current = true
      getCryAudioManager().stop()
      getBattleBgmManager().stop()
    }
  }, [])

  useEffect(() => {
    if (!battle) {
      getBattleBgmManager().stop()
      return
    }
    void getBattleBgmManager().play()
  }, [battle?.id])

  useEffect(() => {
    if (!battle) return
    if (introBattleId.current === battle.id) return
    introBattleId.current = battle.id
    cancelledRef.current = false
    setIntro(initialIntroState(false))
    void runBattleIntro({
      audio: getCryAudioManager(),
      opponent: battle.opponent,
      player: battle.player,
      cancelled: () => cancelledRef.current,
      startedMessage: t('pve.intro.started'),
      onUpdate: setIntro,
    })
  }, [battle, t])

  const pickDefaultAttackSelection = (moves: NonNullable<PveBattle['player']['moves']>) => {
    const usable = moves.find((move) => move.can_use)?.id
    if (usable != null) return usable
    const anyPp = moves.some((move) => move.pp.current > 0)
    if (anyPp) return 'recover' as const
    return 'basic' as const
  }

  const start = async () => {
    if (selectedId == null || busy) return
    setBusy(true)
    setError(null)
    try {
      await getCryAudioManager().markUnlocked()
      const next = await startPveBattle(selectedId, 'normal')
      introBattleId.current = null
      setSelectedMoveId(pickDefaultAttackSelection(next.player.moves ?? []))
      setSelectedDefense('endure')
      setBattle(next)
      void getBattleBgmManager().play()
    } catch (caught) {
      setError(toUserFacingMessage(caught, t('pve.errors.start')))
    } finally {
      setBusy(false)
    }
  }

  const attack = async (opts: { moveId?: number; basic?: boolean; recover?: boolean } = {}) => {
    if (!battle || busy || !intro.controlsEnabled) return
    const previousPhase = battle.phase
    setBusy(true)
    setError(null)
    if (!opts.recover) {
      void playAttackSfx()
    }
    try {
      const result = await submitPveAttack(battle.id, {
        move_id: opts.moveId,
        basic_strike: opts.basic || undefined,
        recover: opts.recover || undefined,
        expected_version: battle.version,
      })
      setSelectedMoveId(pickDefaultAttackSelection(result.battle.player.moves ?? []))
      setBattle(result.battle)
      if (previousPhase !== 'finished' && result.battle.phase === 'finished') {
        void playOutcomeSfx(result.battle.outcome)
        getBattleBgmManager().stop()
      }
    } catch (caught) {
      setError(toUserFacingMessage(caught, t('pve.errors.action')))
    } finally {
      setBusy(false)
    }
  }

  const defend = async (defense: string) => {
    if (!battle || busy || !intro.controlsEnabled) return
    const previousPhase = battle.phase
    setBusy(true)
    setError(null)
    try {
      const result = await submitPveDefense(battle.id, {
        defense,
        expected_version: battle.version,
      })
      setSelectedDefense('endure')
      setSelectedMoveId(pickDefaultAttackSelection(result.battle.player.moves ?? []))
      setBattle(result.battle)
      if (previousPhase !== 'finished' && result.battle.phase === 'finished') {
        void playOutcomeSfx(result.battle.outcome)
        getBattleBgmManager().stop()
      }
    } catch (caught) {
      setError(toUserFacingMessage(caught, t('pve.errors.action')))
    } finally {
      setBusy(false)
    }
  }

  return (
    <RequireAuth>
      <Screen scroll={!battle} contentStyle={battle ? styles.battleScreen : styles.content}>
        <Pressable
          onPress={() => {
            const active = battle && battle.phase !== 'finished' ? battle.id : null
            cancelledRef.current = true
            getCryAudioManager().stop()
            getBattleBgmManager().stop()
            if (active) {
              void abandonPveBattle(active).finally(() => router.back())
              return
            }
            router.back()
          }}
        >
          <Text style={styles.back}>{t('navigation.back')}</Text>
        </Pressable>
        <Text style={styles.eyebrow}>{t('pve.eyebrow')}</Text>
        <Text style={styles.title}>{t('pve.title')}</Text>
        <RecordSummary record={battle?.record ?? user?.pve_record} t={t} />

        <View style={styles.audioRow}>
          <Text style={styles.meta}>{t('pve.audio.sound')}</Text>
          <Switch
            value={soundOn}
            onValueChange={(value) => {
              setSoundOn(value)
              void getCryAudioManager().setMuted(!value)
            }}
          />
        </View>
        <View style={styles.audioRow}>
          <Text style={styles.meta}>{t('pve.audio.music')}</Text>
          <Switch
            value={musicOn}
            disabled={!soundOn}
            onValueChange={(value) => {
              setMusicOn(value)
              void getBattleBgmManager().setMusicEnabled(value)
            }}
          />
        </View>

        {!battle && (
          <View style={styles.block}>
            <Text style={styles.body}>{t('pve.pickDescription')}</Text>
            {creatures.map((owned) => (
              <Pressable
                key={owned.id}
                onPress={() => setSelectedId(owned.id)}
                style={[styles.card, styles.pickCard, selectedId === owned.id && styles.cardActive]}
              >
                <CreatureImage
                  name={owned.creature.name}
                  imageUrl={owned.creature.image_url}
                  imageRef={owned.creature.image_ref}
                  style={styles.pickImage}
                />
                <View style={styles.pickMeta}>
                  <Text style={styles.cardTitle}>{owned.creature.name}</Text>
                  <Text style={styles.meta}>{t('pve.level', { level: owned.level })}</Text>
                </View>
              </Pressable>
            ))}
            <Pressable style={styles.primary} disabled={busy || selectedId == null} onPress={() => void start()}>
              <Text style={styles.primaryText}>{t('pve.start')}</Text>
            </Pressable>
          </View>
        )}

        {battle && (
          <View style={styles.battleLayout}>
            <View style={styles.badgeRow}>
              <Text style={styles.badge}>{t('pve.badge.round', { round: battle.round })}</Text>
              <Text style={styles.badge}>{t(`pve.phases.${battle.phase}`)}</Text>
            </View>

            {intro.message ? <Text style={styles.introBanner}>{intro.message}</Text> : null}

            {intro.showOpponent ? (
              <View style={styles.hud}>
                <View style={styles.hudRow}>
                  <CreatureImage
                    name={battle.opponent.name}
                    imageRef={battle.opponent.image_ref}
                    style={styles.hudThumb}
                  />
                  <View style={styles.hudMeta}>
                    <Text style={styles.cardTitle}>{battle.opponent.name}</Text>
                    <Text style={styles.meta}>{t('pve.level', { level: battle.opponent.level })}</Text>
                  </View>
                </View>
                <MiniBar
                  label={t('pve.resources.hp')}
                  current={battle.opponent.hp.current}
                  max={battle.opponent.hp.max}
                  tone="hp"
                />
                <MiniBar
                  label={t('pve.resources.stamina')}
                  current={battle.opponent.stamina.current}
                  max={battle.opponent.stamina.max}
                  tone="stamina"
                />
              </View>
            ) : null}

            <ImageBackground
              source={arenaBackground}
              style={styles.arena}
              imageStyle={styles.arenaImage}
              resizeMode="cover"
            >
              <View style={styles.arenaScrim} pointerEvents="none" />
              <View style={styles.arenaField}>
                <CreatureImage
                  framed={false}
                  name={battle.opponent.name}
                  imageRef={battle.opponent.image_ref}
                  style={[
                    styles.sprite,
                    styles.spriteOpponent,
                    !intro.showOpponent && styles.hiddenSprite,
                    battle.opponent.hp.current <= 0 && styles.fainted,
                  ]}
                />
                <CreatureImage
                  framed={false}
                  name={battle.player.name}
                  imageRef={battle.player.image_ref}
                  style={[
                    styles.spriteLarge,
                    styles.spritePlayer,
                    !intro.showPlayer && styles.hiddenSprite,
                    battle.player.hp.current <= 0 && styles.fainted,
                  ]}
                />
              </View>
              {battle.phase === 'finished' && battle.outcome === 'win' ? (
                <Image
                  source={winFireworks}
                  style={styles.winFireworks}
                  resizeMode="contain"
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                />
              ) : null}
              {battle.phase === 'finished' && (battle.outcome === 'win' || battle.outcome === 'loss') ? (
                <View style={styles.outcomeBanner} pointerEvents="none" accessibilityRole="text">
                  <Text
                    style={[
                      styles.outcomeBannerText,
                      battle.outcome === 'win' ? styles.outcomeVictory : styles.outcomeLoss,
                    ]}
                  >
                    {battle.outcome === 'win' ? t('pve.arenaBanner.victory') : t('pve.arenaBanner.youLose')}
                  </Text>
                </View>
              ) : null}
            </ImageBackground>

            {intro.showPlayer ? (
              <View style={styles.hud}>
                <View style={styles.hudRow}>
                  <CreatureImage
                    name={battle.player.name}
                    imageRef={battle.player.image_ref}
                    style={styles.hudThumb}
                  />
                  <View style={styles.hudMeta}>
                    <Text style={styles.cardTitle}>{battle.player.name}</Text>
                    <Text style={styles.meta}>{t('pve.level', { level: battle.player.level })}</Text>
                  </View>
                </View>
                <MiniBar
                  label={t('pve.resources.hp')}
                  current={battle.player.hp.current}
                  max={battle.player.hp.max}
                  tone="hp"
                />
                <MiniBar
                  label={t('pve.resources.stamina')}
                  current={battle.player.stamina.current}
                  max={battle.player.stamina.max}
                  tone="stamina"
                />
              </View>
            ) : null}

            <View style={styles.logBox}>
              <Text style={styles.logTitle}>{t('pve.log.title')}</Text>
              <CombatLog entries={battle.combat_log ?? []} t={t} />
            </View>

            <View style={styles.actionsDock}>
              {battle.phase === 'awaiting_player_attack' && (
                <View style={styles.actionBlock}>
                  {(() => {
                    const moves = battle.player.moves ?? []
                    const anyUsable = moves.some((move) => move.can_use)
                    const anyPp = moves.some((move) => move.pp.current > 0)
                    const canRecoverSkip = !anyUsable && anyPp
                    const canBasicStrike = !anyUsable && !anyPp
                    const selectedMove =
                      typeof selectedMoveId === 'number'
                        ? moves.find((move) => move.id === selectedMoveId)
                        : null

                    return (
                      <>
                        <View style={styles.grid}>
                          {moves.map((move, index) => {
                            const tone = ATTACK_TONES[index % ATTACK_TONES.length]
                            const selected = selectedMoveId === move.id
                            return (
                              <Pressable
                                key={String(move.id)}
                                disabled={busy || !intro.controlsEnabled || !move.can_use || move.id == null}
                                onPress={() => move.id != null && setSelectedMoveId(move.id)}
                                style={[styles.action, tone.box, selected && styles.actionSelected]}
                              >
                                <Text style={[styles.actionTitle, tone.title]}>{move.name}</Text>
                                <Text style={styles.meta}>
                                  {t('pve.movePp', { pp: move.pp.current, ppMax: move.pp.max })}
                                </Text>
                                <Text style={styles.meta}>
                                  {t('pve.moveStaminaCost', { stamina: move.stamina_cost })}
                                </Text>
                              </Pressable>
                            )
                          })}
                          {canRecoverSkip ? (
                            <Pressable
                              disabled={busy || !intro.controlsEnabled}
                              onPress={() => setSelectedMoveId('recover')}
                              style={[
                                styles.action,
                                DEFENSE_TONES.recover.box,
                                selectedMoveId === 'recover' && styles.actionSelected,
                              ]}
                            >
                              <Text style={[styles.actionTitle, DEFENSE_TONES.recover.title]}>
                                {t('pve.actions.recoverSkip')}
                              </Text>
                              <Text style={styles.meta}>{t('pve.actions.recoverSkipHelp')}</Text>
                            </Pressable>
                          ) : null}
                          {canBasicStrike ? (
                            <Pressable
                              disabled={busy || !intro.controlsEnabled}
                              onPress={() => setSelectedMoveId('basic')}
                              style={[
                                styles.action,
                                ATTACK_TONES[1].box,
                                selectedMoveId === 'basic' && styles.actionSelected,
                              ]}
                            >
                              <Text style={[styles.actionTitle, ATTACK_TONES[1].title]}>
                                {t('pve.actions.basicStrike')}
                              </Text>
                              <Text style={styles.meta}>{t('pve.actions.basicStrikeHelp')}</Text>
                            </Pressable>
                          ) : null}
                        </View>
                        {selectedMoveId === 'recover' ? (
                          <View style={styles.helpBox}>
                            <Text style={styles.helpTitle}>{t('pve.actions.recoverSkip')}</Text>
                            <Text style={styles.helpBody}>{t('pve.actions.recoverSkipHelp')}</Text>
                          </View>
                        ) : null}
                        {selectedMove ? (
                          <View style={styles.helpBox}>
                            <Text style={styles.helpTitle}>{selectedMove.name}</Text>
                            <Text style={styles.helpBody}>
                              {t('pve.actions.moveHelp', {
                                name: selectedMove.name,
                                power: selectedMove.power,
                                type: selectedMove.type,
                                class: selectedMove.damage_class,
                                stamina: selectedMove.stamina_cost,
                                accuracy: selectedMove.accuracy,
                              })}
                            </Text>
                            <Text style={styles.meta}>
                              {t('pve.moveMeta', {
                                power: selectedMove.power,
                                stamina: selectedMove.stamina_cost,
                                pp: selectedMove.pp.current,
                                ppMax: selectedMove.pp.max,
                              })}
                            </Text>
                          </View>
                        ) : null}
                        <Pressable
                          style={styles.primary}
                          disabled={busy || !intro.controlsEnabled || selectedMoveId == null}
                          onPress={() => {
                            if (selectedMoveId === 'recover') {
                              void attack({ recover: true })
                              return
                            }
                            if (selectedMoveId === 'basic') {
                              void attack({ basic: true })
                              return
                            }
                            if (typeof selectedMoveId === 'number') {
                              void attack({ moveId: selectedMoveId })
                            }
                          }}
                        >
                          <Text style={styles.primaryText}>
                            {selectedMoveId === 'recover'
                              ? t('pve.actions.useRecoverSkip')
                              : selectedMoveId === 'basic'
                                ? t('pve.actions.useBasicStrike')
                                : t('pve.actions.useMove', {
                                    move: selectedMove?.name ?? '—',
                                  })}
                          </Text>
                        </Pressable>
                      </>
                    )
                  })()}
                </View>
              )}

              {battle.phase === 'awaiting_player_defense' && (
                <View style={styles.actionBlock}>
                  <View style={styles.grid}>
                    {(['endure', 'block', 'dodge', 'recover'] as const).map((defense) => {
                      const tone = DEFENSE_TONES[defense]
                      const selected = selectedDefense === defense
                      return (
                        <Pressable
                          key={defense}
                          disabled={busy || !intro.controlsEnabled}
                          onPress={() => setSelectedDefense(defense)}
                          style={[styles.action, tone.box, selected && styles.actionSelected]}
                        >
                          <Text style={[styles.actionTitle, tone.title]}>
                            {t(`pve.defense.${defense}.label`)}
                          </Text>
                          <Text style={styles.meta}>{t(`pve.defense.${defense}.hint`)}</Text>
                        </Pressable>
                      )
                    })}
                  </View>
                  <View style={styles.helpBox}>
                    <Text style={[styles.helpTitle, DEFENSE_TONES[selectedDefense].title]}>
                      {t(`pve.defense.${selectedDefense}.label`)}
                    </Text>
                    <Text style={styles.helpBody}>
                      {t(`pve.defense.${selectedDefense}.description`)}
                    </Text>
                  </View>
                  <Pressable
                    style={[styles.primary, styles.defenseConfirm]}
                    disabled={busy || !intro.controlsEnabled}
                    onPress={() => void defend(selectedDefense)}
                  >
                    <Text style={styles.primaryText}>
                      {t('pve.actions.useDefense', {
                        defense: t(`pve.defense.${selectedDefense}.label`),
                      })}
                    </Text>
                  </Pressable>
                </View>
              )}

              {battle.phase === 'finished' && (
                <View>
                  <Text style={styles.title}>
                    {battle.outcome === 'win'
                      ? t('pve.result.win')
                      : battle.end_reason === 'abandoned'
                        ? t('pve.result.gaveUp')
                        : t('pve.result.loss')}
                  </Text>
                  {battle.reward ? (
                    <Text style={styles.meta}>{t('pve.result.xp', { xp: battle.reward.xp_awarded })}</Text>
                  ) : null}
                  <RecordSummary record={battle.record} t={t} />
                  <Pressable
                    style={styles.primary}
                    onPress={() => {
                      cancelledRef.current = true
                      getCryAudioManager().stop()
                      introBattleId.current = null
                      setBattle(null)
                      setIntro(initialIntroState(true))
                      void loadCollection()
                    }}
                  >
                    <Text style={styles.primaryText}>{t('pve.result.again')}</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </Screen>
    </RequireAuth>
  )
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xxxl },
  battleScreen: { flex: 1, gap: spacing.sm },
  battleLayout: { flex: 1, gap: spacing.sm, minHeight: 0 },
  back: { color: colors.ember, fontWeight: '700', marginBottom: spacing.sm },
  eyebrow: {
    color: colors.ember,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: { color: colors.text, fontSize: 28, fontWeight: '800' },
  body: { color: colors.textMuted, marginBottom: spacing.md },
  recordRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  recordChip: {
    borderRadius: 999,
    borderWidth: 1,
    fontSize: 11,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    textTransform: 'uppercase',
  },
  recordWin: {
    backgroundColor: 'rgba(52,211,153,0.12)',
    borderColor: 'rgba(52,211,153,0.35)',
    color: '#34D399',
  },
  recordLoss: {
    backgroundColor: 'rgba(248,113,113,0.12)',
    borderColor: 'rgba(248,113,113,0.35)',
    color: colors.danger,
  },
  recordGiveUp: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    color: colors.textMuted,
  },
  audioRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  introBanner: {
    backgroundColor: 'rgba(52,211,153,0.12)',
    borderColor: 'rgba(52,211,153,0.35)',
    borderRadius: 12,
    borderWidth: 1,
    color: '#34D399',
    fontWeight: '700',
    padding: spacing.sm,
  },
  block: { gap: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    padding: spacing.md,
  },
  pickCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  pickImage: {
    height: 72,
    width: 72,
  },
  pickMeta: {
    flex: 1,
  },
  cardActive: { borderColor: colors.ember },
  cardTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: {
    backgroundColor: 'rgba(39,201,236,0.12)',
    borderColor: 'rgba(39,201,236,0.35)',
    borderRadius: 999,
    borderWidth: 1,
    color: colors.electric,
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  hud: {
    backgroundColor: 'rgba(11,18,32,0.94)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
    padding: spacing.sm,
  },
  hudRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  hudThumb: { height: 44, width: 44 },
  hudMeta: { flex: 1 },
  arena: {
    aspectRatio: 16 / 10,
    backgroundColor: '#0a1424',
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 200,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  arenaImage: {
    borderRadius: 15,
    // cover + centered crop keeps the grass circle in frame without stretch
  },
  arenaScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
  winFireworks: {
    ...StyleSheet.absoluteFillObject,
    height: '70%',
    left: '15%',
    top: '12%',
    width: '70%',
    zIndex: 5,
  },
  outcomeBanner: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    zIndex: 6,
  },
  outcomeBannerText: {
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 12,
  },
  outcomeVictory: {
    color: '#FFE566',
  },
  outcomeLoss: {
    color: '#FF6B6B',
  },
  arenaField: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  sprite: {
    height: 92,
    opacity: 1,
    position: 'absolute',
    width: 92,
    zIndex: 1,
  },
  spriteLarge: {
    height: 112,
    opacity: 1,
    position: 'absolute',
    width: 112,
    zIndex: 1,
  },
  spriteOpponent: {
    bottom: '38%',
    left: '8%',
  },
  spritePlayer: {
    bottom: '6%',
    right: '6%',
  },
  hiddenSprite: { opacity: 0 },
  fainted: { opacity: 0.35 },
  barBlock: { gap: 4, marginTop: 2 },
  barLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  barLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  barTrack: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 999,
    height: 8,
    overflow: 'hidden',
  },
  barFill: { borderRadius: 999, height: '100%' },
  logBox: {
    backgroundColor: '#070d18',
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    gap: spacing.sm,
    minHeight: 120,
    padding: spacing.md,
  },
  logTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  logScroll: { flex: 1, minHeight: 0 },
  logList: { gap: spacing.sm, paddingBottom: spacing.sm },
  logCard: {
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    borderWidth: 1,
    gap: 2,
    padding: spacing.sm,
  },
  logRound: {
    color: colors.electric,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  logLine: { color: colors.textMuted, fontSize: 13 },
  logStrong: { color: colors.text, fontSize: 13, fontWeight: '700' },
  logDamage: { color: colors.danger, fontSize: 13, fontWeight: '700' },
  logOk: { color: '#34D399', fontSize: 13, fontWeight: '700' },
  logWin: { color: '#FBBF24', fontSize: 13, fontWeight: '700' },
  logEmpty: { color: colors.textMuted, fontSize: 13 },
  actionsDock: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.md,
  },
  primary: {
    alignItems: 'center',
    backgroundColor: colors.ember,
    borderRadius: 12,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
  },
  primaryText: { color: colors.background, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  actionBlock: { gap: spacing.sm },
  action: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: '47%',
    padding: spacing.md,
  },
  actionSelected: {
    borderWidth: 2,
  },
  actionTitle: { color: colors.text, fontWeight: '700' },
  helpBox: {
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    padding: spacing.md,
  },
  helpTitle: { color: colors.text, fontSize: 14, fontWeight: '800' },
  helpBody: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  defenseConfirm: { backgroundColor: colors.electric },
  error: { color: colors.danger, marginTop: spacing.md },
})
