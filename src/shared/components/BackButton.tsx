import { router } from 'expo-router'
import { Pressable, StyleSheet, Text } from 'react-native'
import { useTranslation } from 'react-i18next'

import { colors } from '@/src/theme/colors'
import { spacing } from '@/src/theme/spacing'

export function BackButton({ fallbackHref = '/' }: { fallbackHref?: string }) {
  const { t } = useTranslation()

  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={8}
      onPress={() => (router.canGoBack() ? router.back() : router.replace(fallbackHref))}
      style={styles.back}>
      <Text style={styles.text}>{t('navigation.back')}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  back: {
    alignSelf: 'flex-start',
    marginBottom: spacing.lg,
    minHeight: 32,
    justifyContent: 'center',
  },
  text: {
    color: colors.ember,
    fontWeight: '700',
  },
})

