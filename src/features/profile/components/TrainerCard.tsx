import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import type { TrainerProgress } from '@/src/features/auth/types'
import { colors } from '@/src/theme/colors'
import { spacing } from '@/src/theme/spacing'

import { TrainerAllowances } from './TrainerAllowances'

export function TrainerCard({ trainer }: { trainer: TrainerProgress }) {
  const { t } = useTranslation()
  const percent = Math.max(0, Math.min(100, trainer.progress_percent))

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.label}>{t('profile.trainer.title')}</Text>
        <Text style={styles.level}>{t('profile.trainer.level', { level: trainer.level })}</Text>
      </View>
      <View
        accessibilityLabel={t('profile.trainer.progressLabel', { percent: Math.round(percent) })}
        accessibilityRole="progressbar"
        style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%` }]} />
      </View>
      <Text style={styles.xp}>
        {trainer.is_max_level
          ? t('profile.trainer.maxLevel', { xp: trainer.total_xp })
          : t('profile.trainer.xpProgress', {
              current: trainer.xp_into_level,
              needed: trainer.xp_for_next_level ?? 0,
              total: trainer.total_xp,
            })}
      </Text>
      <TrainerAllowances trainer={trainer} />
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: spacing.lg,
    padding: spacing.lg,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  level: {
    color: colors.gold,
    fontSize: 18,
    fontWeight: '800',
  },
  track: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: 999,
    height: 8,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  fill: {
    backgroundColor: colors.ember,
    borderRadius: 999,
    height: 8,
  },
  xp: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.sm,
  },
})
