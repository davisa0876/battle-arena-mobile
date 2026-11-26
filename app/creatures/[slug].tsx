import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { Creature } from '@/src/features/creatures/types/creature'
import { useTranslation } from 'react-i18next'

import { RequireAuth } from '@/src/features/auth'
import { AddToCollectionButton } from '@/src/features/creatures/components/AddToCollectionButton'
import { CreatureImage } from '@/src/features/creatures/components/CreatureImage'
import { StatBar } from '@/src/features/creatures/components/StatBar'
import { useCreatureDetail } from '@/src/features/creatures/hooks/useCreatureDetail'
import { LoadingState } from '@/src/shared/components/LoadingState'
import { Screen } from '@/src/shared/components/Screen'
import { formatHeight, formatWeight } from '@/src/shared/lib/formatters/creatures'
import { currentAppLanguage } from '@/src/i18n'
import { colors } from '@/src/theme/colors'
import { spacing } from '@/src/theme/spacing'

export default function CreatureDetailScreen() {
  const { slug = '' } = useLocalSearchParams<{ slug: string }>()
  const { t } = useTranslation()
  const locale = currentAppLanguage()
  const [retryToken, setRetryToken] = useState(0)
  const state = useCreatureDetail(typeof slug === 'string' ? slug : slug[0] ?? '', retryToken)

  return (
    <RequireAuth>
    <Screen>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>{t('navigation.back')}</Text>
      </Pressable>

      {state.status === 'loading' && <LoadingState label={t('creatures.detail.loading')} />}

      {state.status === 'error' && (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>{state.message}</Text>
          {!state.notFound && (
            <Pressable style={styles.retry} onPress={() => setRetryToken((value) => value + 1)}>
              <Text style={styles.retryText}>{t('common.retry')}</Text>
            </Pressable>
          )}
        </View>
      )}

      {state.status === 'ready' && (
        <View style={styles.content}>
          <View style={[styles.heroPanel, state.creature.is_owned ? styles.heroPanelOwned : null]}>
            <CreatureImage
              name={state.creature.name}
              imageUrl={state.creature.image_url}
              imageRef={state.creature.image_ref}
              style={styles.hero}
            />
            <Text style={styles.eyebrow}>{t('creatures.detail.eyebrow')}</Text>
            {state.creature.is_owned ? (
              <Text style={styles.ownedBadge}>{t('creatures.detail.ownedBadge')}</Text>
            ) : null}
            <Text style={styles.title}>{state.creature.name}</Text>
            <View style={styles.types}>
              {state.creature.types.map((type) => (
                <View key={type.id} style={styles.typeChip}>
                  <Text style={styles.typeText}>{type.name}</Text>
                </View>
              ))}
            </View>
            <AddToCollectionButton
              creature={state.creature}
              onSelected={() => setRetryToken((value) => value + 1)}
            />
          </View>

          <View style={styles.metrics}>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>{t('creatures.detail.height')}</Text>
              <Text style={styles.metricValue}>
                {formatHeight(state.creature.height_cm, t('creatures.detail.unavailable'), locale)}
              </Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>{t('creatures.detail.weight')}</Text>
              <Text style={styles.metricValue}>
                {formatWeight(state.creature.weight_g, t('creatures.detail.unavailable'), locale)}
              </Text>
            </View>
          </View>

          <Text style={styles.statsTitle}>{t('creatures.detail.baseStats')}</Text>
          <StatBar label={t('creatures.stats.hp')} value={state.creature.base_stats.hp} />
          <StatBar label={t('creatures.stats.attack')} value={state.creature.base_stats.attack} />
          <StatBar label={t('creatures.stats.defense')} value={state.creature.base_stats.defense} />
          <StatBar
            label={t('creatures.stats.special_attack')}
            value={state.creature.base_stats.special_attack}
          />
          <StatBar
            label={t('creatures.stats.special_defense')}
            value={state.creature.base_stats.special_defense}
          />
          <StatBar label={t('creatures.stats.speed')} value={state.creature.base_stats.speed} />

          {state.creature.combat ? (
            <View style={styles.combatSection}>
              <Text style={styles.statsTitle}>{t('creatures.detail.attacksTitle')}</Text>
              <Text style={styles.evolutionsHint}>{t('creatures.detail.attacksHint')}</Text>
              {state.creature.combat.attacks.length === 0 ? (
                <Text style={styles.evolutionsHint}>{t('creatures.detail.attacksEmpty')}</Text>
              ) : (
                state.creature.combat.attacks.map((move) => (
                  <View key={move.slug} style={styles.combatCard}>
                    <View style={styles.combatCardHeader}>
                      <Text style={styles.combatName}>{move.name}</Text>
                      <Text style={styles.combatType}>{move.type_slug}</Text>
                    </View>
                    <Text style={styles.combatMeta}>
                      {t('creatures.detail.attackMeta', {
                        power: move.power,
                        stamina: move.stamina_cost,
                        pp: move.pp,
                        class: move.damage_class,
                        accuracy: move.accuracy,
                      })}
                    </Text>
                  </View>
                ))
              )}

              <Text style={styles.statsTitle}>{t('creatures.detail.defensesTitle')}</Text>
              <Text style={styles.evolutionsHint}>{t('creatures.detail.defensesHint')}</Text>
              {state.creature.combat.defenses.map((defense) => (
                <View key={defense.slug} style={styles.combatCard}>
                  <View style={styles.combatCardHeader}>
                    <Text style={styles.combatName}>
                      {t(`creatures.detail.defenseNames.${defense.slug}`, { defaultValue: defense.name })}
                    </Text>
                    <Text style={styles.combatType}>
                      {t('creatures.detail.staminaCost', { stamina: defense.stamina_cost })}
                    </Text>
                  </View>
                  <Text style={styles.combatMeta}>
                    {t(`creatures.detail.defenseBlurb.${defense.slug}`, {
                      multiplier: defense.damage_multiplier ?? 1,
                      chance:
                        defense.success_chance != null ? Math.round(defense.success_chance * 100) : 0,
                      restore: defense.stamina_restore ?? 0,
                    })}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {(state.creature.evolutions?.length ?? 0) > 0 && (
            <View style={styles.evolutions}>
              <Text style={styles.statsTitle}>{t('creatures.detail.evolutionsTitle')}</Text>
              <Text style={styles.evolutionsHint}>{t('creatures.detail.evolutionsDescription')}</Text>
              {state.creature.evolutions?.map((evolution) => (
                <EvolutionRow key={evolution.id} evolution={evolution} />
              ))}
            </View>
          )}
        </View>
      )}
    </Screen>
    </RequireAuth>
  )
}

function EvolutionRow({ evolution }: { evolution: Creature }) {
  const { t } = useTranslation()

  return (
    <View>
      <Pressable
        onPress={() => router.push(`/creatures/${evolution.slug}`)}
        style={styles.evolutionCard}
      >
        <CreatureImage
          name={evolution.name}
          imageUrl={evolution.image_url}
          imageRef={evolution.image_ref}
          style={styles.evolutionImage}
        />
        <View style={styles.evolutionMeta}>
          <Text style={styles.evolutionStage}>
            {t('creatures.detail.evolutionStage', { stage: evolution.evolution_stage ?? '—' })}
          </Text>
          <Text style={styles.evolutionName}>{evolution.name}</Text>
        </View>
      </Pressable>
      {(evolution.evolutions?.length ?? 0) > 0 && (
        <View style={styles.evolutionNested}>
          {evolution.evolutions?.map((child) => (
            <EvolutionRow key={child.id} evolution={child} />
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  back: {
    alignSelf: 'flex-start',
    marginBottom: spacing.lg,
  },
  backText: {
    color: colors.ember,
    fontWeight: '700',
  },
  feedback: {
    color: colors.textMuted,
  },
  errorBox: {
    backgroundColor: '#2A1518',
    borderColor: colors.danger,
    borderRadius: 14,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  errorTitle: {
    color: colors.danger,
    fontWeight: '700',
  },
  retry: {
    alignSelf: 'flex-start',
    borderColor: colors.ember,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  retryText: {
    color: colors.ember,
    fontWeight: '700',
  },
  content: {
    gap: spacing.md,
  },
  heroPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  heroPanelOwned: {
    backgroundColor: colors.ownedSurface,
    borderColor: colors.neon,
    borderWidth: 2,
  },
  hero: {
    marginBottom: spacing.sm,
  },
  eyebrow: {
    color: colors.ember,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  ownedBadge: {
    color: colors.neon,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: spacing.xs,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '800',
  },
  types: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeChip: {
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  typeText: {
    color: colors.electric,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  metrics: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metric: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    padding: spacing.md,
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: 12,
  },
  metricValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  statsTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  evolutions: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  evolutionsHint: {
    color: colors.textMuted,
    fontSize: 13,
  },
  evolutionCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  evolutionImage: {
    height: 72,
    width: 72,
  },
  evolutionMeta: {
    flex: 1,
    gap: spacing.xs,
  },
  evolutionStage: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  evolutionName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  evolutionNested: {
    borderLeftColor: colors.border,
    borderLeftWidth: 1,
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingLeft: spacing.md,
  },
  combatSection: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  combatCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  combatCardHeader: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  combatName: {
    color: colors.text,
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  combatType: {
    color: colors.ember,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  combatMeta: {
    color: colors.textMuted,
    fontSize: 12,
  },
})
