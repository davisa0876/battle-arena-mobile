import { useState } from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native'
import { useTranslation } from 'react-i18next'

import { colors } from '@/src/theme/colors'
import { spacing } from '@/src/theme/spacing'

interface FormFieldProps extends Omit<TextInputProps, 'style'> {
  label: string
  error?: string
  hint?: string
  /** Renders a show/hide toggle and hides the text by default. */
  password?: boolean
}

export function FormField({ label, error, hint, password = false, ...inputProps }: FormFieldProps) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, error ? styles.inputError : null]}>
        <TextInput
          {...inputProps}
          accessibilityLabel={label}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={password && !visible}
          style={[styles.input, inputProps.multiline ? styles.multiline : null]}
          autoCapitalize={inputProps.autoCapitalize ?? 'none'}
          autoCorrect={inputProps.autoCorrect ?? false}
        />
        {password ? (
          <Pressable
            accessibilityLabel={visible ? t('auth.hidePassword') : t('auth.showPassword')}
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setVisible((value) => !value)}
            style={styles.toggle}>
            <Text style={styles.toggleText}>{visible ? t('auth.hide') : t('auth.show')}</Text>
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!error && hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  field: {
    marginBottom: spacing.lg,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  inputRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
  },
  inputError: {
    borderColor: colors.danger,
  },
  input: {
    color: colors.text,
    flex: 1,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  multiline: {
    minHeight: 112,
    paddingTop: spacing.md,
  },
  toggle: {
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  toggleText: {
    color: colors.electric,
    fontSize: 13,
    fontWeight: '700',
  },
  error: {
    color: colors.danger,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.xs,
  },
})
