import { Image, StyleSheet, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { spacing } from '@/src/theme/spacing'

const loadingGif = require('../../../assets/brand/loading.gif')

/** Centered loading.gif — no on-screen loading text (label is for accessibility only). */
export function LoadingState({ label }: { label?: string }) {
  const { t } = useTranslation()
  const a11y = label ?? t('common.loading')

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityLabel={a11y}
      accessibilityRole="progressbar"
      style={styles.container}
    >
      <Image source={loadingGif} style={styles.gif} resizeMode="contain" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: 220,
    paddingVertical: spacing.xxl,
    width: '100%',
  },
  gif: {
    height: 96,
    width: 96,
  },
})
