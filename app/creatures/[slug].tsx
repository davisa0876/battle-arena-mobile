import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { CreatureImage } from '@/src/features/creatures/components/CreatureImage'
import { StatBar } from '@/src/features/creatures/components/StatBar'
import { useCreatureDetail } from '@/src/features/creatures/hooks/useCreatureDetail'
import { Screen } from '@/src/shared/components/Screen'
import { colors } from '@/src/theme/colors'
import { spacing } from '@/src/theme/spacing'

export default function CreatureDetailScreen() {
  const { slug = '' } = useLocalSearchParams<{ slug: string }>()
  const { t } = useTranslation()
  const [retryToken, setRetryToken] = useState(0)
  const state = useCreatureDetail(typeof slug === 'string' ? slug : slug[0] ?? '', retryToken)

  return (
    <Screen>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>{t('navigation.back')}</Text>
      </Pressable>

      {state.status === 'loading' && <Text style={styles.feedback}>{t('creatures.detail.loading')}</Text>}

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
          <CreatureImage
            name={state.creature.name}
            imageUrl={state.creature.image_url}
            imageRef={state.creature.image_ref}
            style={styles.hero}
          />
          <Text style={styles.eyebrow}>{t('creatures.detail.eyebrow')}</Text>
          <Text style={styles.title}>{state.creature.name}</Text>
          <View style={styles.types}>
            {state.creature.types.map((type) => (
              <View key={type.id} style={styles.typeChip}>
                <Text style={styles.typeText}>{type.name}</Text>
              </View>
            ))}
          </View>

          <View style={styles.metrics}>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>{t('creatures.detail.height')}</Text>
              <Text style={styles.metricValue}>
                {state.creature.height_cm == null
                  ? t('creatures.detail.unavailable')
                  : `${(state.creature.height_cm / 100).toFixed(2)} m`}
              </Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>{t('creatures.detail.weight')}</Text>
              <Text style={styles.metricValue}>
                {state.creature.weight_g == null
                  ? t('creatures.detail.unavailable')
                  : `${(state.creature.weight_g / 1000).toFixed(1)} kg`}
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
        </View>
      )}
    </Screen>
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
  hero: {
    marginBottom: spacing.md,
  },
  eyebrow: {
    color: colors.ember,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
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
})
