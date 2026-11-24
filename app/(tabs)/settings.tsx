import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { Screen } from '@/src/shared/components/Screen'
import {
  changeAppLanguage,
  currentAppLanguage,
  languageLabels,
  supportedLanguages,
} from '@/src/i18n'
import { colors } from '@/src/theme/colors'
import { spacing } from '@/src/theme/spacing'

export default function SettingsScreen() {
  const { t } = useTranslation()
  const active = currentAppLanguage()

  return (
    <Screen>
      <Text style={styles.eyebrow}>{t('settings.eyebrow')}</Text>
      <Text style={styles.title}>{t('settings.title')}</Text>
      <Text style={styles.description}>{t('settings.languageDescription')}</Text>
      <Text style={styles.current}>
        {t('settings.currentLanguage', { language: languageLabels[active] })}
      </Text>
      <Text style={styles.hint}>{t('settings.systemDefault')}</Text>

      <View style={styles.list}>
        {supportedLanguages.map((language) => {
          const selected = language === active
          return (
            <Pressable
              key={language}
              onPress={() => void changeAppLanguage(language)}
              style={[styles.option, selected && styles.optionActive]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text style={[styles.optionText, selected && styles.optionTextActive]}>
                {languageLabels[language]}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  eyebrow: {
    color: colors.electric,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  description: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.md,
  },
  current: {
    color: colors.gold,
    fontWeight: '700',
    marginTop: spacing.lg,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: spacing.xl,
    marginTop: spacing.sm,
  },
  list: {
    gap: spacing.sm,
  },
  option: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  optionActive: {
    borderColor: colors.ember,
  },
  optionText: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '700',
  },
  optionTextActive: {
    color: colors.text,
  },
})
