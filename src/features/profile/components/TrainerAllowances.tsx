import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import type { TrainerProgress } from '@/src/features/auth/types'
import { colors } from '@/src/theme/colors'
import { spacing } from '@/src/theme/spacing'

/**
 * Owner-only selection quotas and PvP eligibility.
 * Every value comes from the /me trainer payload; the client never derives quotas from the level.
 */
export function TrainerAllowances({ trainer }: { trainer: TrainerProgress }) {
  const { t } = useTranslation()
  const allowances = trainer.selection_allowances
  const pvp = trainer.pvp_level_unlocked

  if (allowances === undefined && pvp === undefined) {
    return null
  }

  return (
    <View style={styles.box}>
      <Text accessibilityRole="header" style={styles.title}>
        {t('profile.allowances.title')}
      </Text>
      <Text style={styles.hint}>{t('profile.allowances.hint')}</Text>

      {(allowances ?? []).map((allowance) => (
        <View key={allowance.evolution_stage} style={styles.row}>
          <Text style={styles.label}>{t('profile.allowances.stage', { stage: allowance.evolution_stage })}</Text>
          <View style={styles.values}>
            <Text style={styles.value}>
              {t('profile.allowances.remaining', { remaining: allowance.remaining, total: allowance.total })}
            </Text>
            <Text style={styles.sub}>{t('profile.allowances.used', { used: allowance.used })}</Text>
          </View>
        </View>
      ))}

      {pvp !== undefined ? (
        <View style={styles.row}>
          <Text style={styles.label}>{t('profile.allowances.pvp')}</Text>
          <Text style={[styles.value, pvp ? styles.ok : styles.locked]}>
            {pvp ? t('profile.allowances.pvpUnlocked') : t('profile.allowances.pvpLocked')}
          </Text>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  box: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
  },
  title: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  values: {
    alignItems: 'flex-end',
  },
  value: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: '800',
  },
  sub: {
    color: colors.textMuted,
    fontSize: 11,
  },
  ok: {
    color: colors.success,
  },
  locked: {
    color: colors.textMuted,
  },
})