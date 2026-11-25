import { Link, router } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { ActionButton } from '@/src/shared/components/ActionButton'
import { colors } from '@/src/theme/colors'
import { spacing } from '@/src/theme/spacing'

import { useAuth } from '../hooks/AuthContext'

/** Shortcuts for signed-in trainers on the home screen (home itself requires auth). */
export function HomeAccountActions() {
  const { t } = useTranslation()
  const { status, user, signOut } = useAuth()

  if (status !== 'authenticated' || !user) {
    return null
  }

  return (
    <View style={styles.box}>
      <Text style={styles.title}>
        {t('auth.home.welcome', { name: user.profile?.display_name ?? user.email ?? '' })}
      </Text>
      <View style={styles.actions}>
        <ActionButton onPress={() => router.push('/profile')}>{t('navigation.profile')}</ActionButton>
        <ActionButton
          variant="secondary"
          onPress={() =>
            router.push(user.onboarding.starter_selected ? '/my-collection' : '/starter-selection')
          }>
          {user.onboarding.starter_selected ? t('navigation.collection') : t('collection.chooseStarter')}
        </ActionButton>
        <Link href="/game-rules" style={styles.link}>
          {t('navigation.gameRules')}
        </Link>
        <ActionButton variant="danger" onPress={() => void signOut()}>
          {t('auth.logout')}
        </ActionButton>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: spacing.xl,
    padding: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  link: {
    color: colors.electric,
    fontWeight: '700',
    paddingVertical: spacing.sm,
    textAlign: 'center',
  },
})
