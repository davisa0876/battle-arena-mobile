import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { colors } from '@/src/theme/colors'
import { spacing } from '@/src/theme/spacing'

export function LoadingState({ label }: { label?: string }) {
  const { t } = useTranslation()

  return (
    <View accessibilityLiveRegion="polite" style={styles.container}>
      <ActivityIndicator color={colors.ember} />
      <Text style={styles.label}>{label ?? t('common.loading')}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.md,
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  label: {
    color: colors.textMuted,
  },
})
