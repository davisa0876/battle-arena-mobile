import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { colors } from '@/src/theme/colors'
import { spacing } from '@/src/theme/spacing'

interface MessageBoxProps {
  tone: 'error' | 'success' | 'info'
  message: string
  title?: string
  onRetry?: () => void
}

export function MessageBox({ tone, message, title, onRetry }: MessageBoxProps) {
  const { t } = useTranslation()

  return (
    <View
      accessibilityRole={tone === 'error' ? 'alert' : undefined}
      style={[styles.box, tone === 'error' && styles.error, tone === 'success' && styles.success]}>
      {title ? (
        <Text style={[styles.title, tone === 'error' && styles.errorText]}>{title}</Text>
      ) : null}
      <Text style={[styles.message, tone === 'error' && styles.errorText]}>{message}</Text>
      {onRetry ? (
        <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retry}>
          <Text style={styles.retryText}>{t('common.retry')}</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: spacing.sm,
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  error: {
    backgroundColor: '#2A1518',
    borderColor: colors.danger,
  },
  success: {
    borderColor: colors.success,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  message: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    color: colors.danger,
  },
  retry: {
    alignSelf: 'flex-start',
    borderColor: colors.ember,
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  retryText: {
    color: colors.ember,
    fontWeight: '700',
  },
})
