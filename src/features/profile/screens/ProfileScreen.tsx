import { Link, router } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { useState } from 'react'
import { RequireAuth, useAuth, type AuthUser } from '@/src/features/auth'
import { ActionButton } from '@/src/shared/components/ActionButton'
import { Avatar } from '@/src/shared/components/Avatar'
import { MessageBox } from '@/src/shared/components/MessageBox'
import { Screen } from '@/src/shared/components/Screen'
import { ApiError } from '@/src/shared/lib/api-client'
import { colors } from '@/src/theme/colors'
import { spacing } from '@/src/theme/spacing'

import { resendVerificationEmail } from '../api/profile'
import { TrainerCard } from '../components/TrainerCard'

function ProfileContent({ user }: { user: AuthUser }) {
  const { t } = useTranslation()
  const { signOut, refreshUser } = useAuth()
  const profile = user.profile
  const name = profile?.display_name ?? user.email
  const [verifyBusy, setVerifyBusy] = useState(false)
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null)
  const [verifyError, setVerifyError] = useState<string | null>(null)

  async function onResendVerification() {
    setVerifyBusy(true)
    setVerifyError(null)
    setVerifyMessage(null)
    try {
      const response = await resendVerificationEmail()
      setVerifyMessage(response.message)
      await refreshUser()
    } catch (error) {
      setVerifyError(error instanceof ApiError ? error.message : t('errors.unexpected'))
    } finally {
      setVerifyBusy(false)
    }
  }

  return (
    <Screen>
      <Text style={styles.eyebrow}>{t('profile.eyebrow')}</Text>

      <View style={styles.hero}>
        <Avatar name={name} url={profile?.avatar_url} size={96} />
        <View style={styles.heroText}>
          <Text accessibilityRole="header" style={styles.name}>
            {name}
          </Text>
          {profile ? <Text style={styles.handle}>@{profile.handle}</Text> : null}
          <Text style={styles.email}>{user.email}</Text>
          <Text style={[styles.chip, user.email_verified ? styles.chipOk : styles.chipWarn]}>
            {user.email_verified ? t('profile.emailVerified') : t('profile.emailUnverified')}
          </Text>
        </View>
      </View>

      {!user.email_verified ? (
        <View style={styles.verifyBox}>
          {verifyError ? <MessageBox tone="error" message={verifyError} /> : null}
          {verifyMessage ? <MessageBox tone="success" message={verifyMessage} /> : null}
          <ActionButton variant="secondary" loading={verifyBusy} onPress={() => void onResendVerification()}>
            {t('profile.resendVerification')}
          </ActionButton>
        </View>
      ) : null}

      {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

      {user.trainer ? <TrainerCard trainer={user.trainer} /> : null}

      <View style={styles.meta}>
        <Text style={styles.metaLabel}>{t('profile.collectionVisibility')}</Text>
        <Text style={styles.metaValue}>
          {profile?.collection_is_public ? t('profile.collectionPublic') : t('profile.collectionPrivate')}
        </Text>
      </View>

      <View style={styles.actions}>
        <ActionButton onPress={() => router.push('/profile/edit')}>{t('profile.edit')}</ActionButton>
        {user.onboarding.starter_selected ? (
          <ActionButton variant="secondary" onPress={() => router.push('/my-collection')}>
            {t('collection.open')}
          </ActionButton>
        ) : (
          <ActionButton variant="secondary" onPress={() => router.push('/starter-selection')}>
            {t('collection.chooseStarter')}
          </ActionButton>
        )}
        {profile ? (
          <Link href={`/players/${profile.handle}`} style={styles.link}>
            {t('profile.viewPublic')}
          </Link>
        ) : null}
        <ActionButton variant="danger" onPress={() => void signOut()}>
          {t('auth.logout')}
        </ActionButton>
      </View>
    </Screen>
  )
}

export function ProfileScreen() {
  return (
    <RequireAuth>
      <ProfileGate />
    </RequireAuth>
  )
}

function ProfileGate() {
  const { user } = useAuth()
  return user ? <ProfileContent user={user} /> : null
}

const styles = StyleSheet.create({
  eyebrow: {
    color: colors.ember,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  hero: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  heroText: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
  },
  handle: {
    color: colors.electric,
    fontSize: 14,
    fontWeight: '700',
  },
  email: {
    color: colors.textMuted,
    fontSize: 13,
  },
  chip: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: spacing.xs,
    textTransform: 'uppercase',
  },
  chipOk: {
    color: colors.success,
  },
  chipWarn: {
    color: colors.gold,
  },
  bio: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.lg,
  },
  meta: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: spacing.md,
    padding: spacing.lg,
  },
  metaLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  metaValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  verifyBox: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  link: {
    color: colors.electric,
    fontWeight: '700',
    paddingVertical: spacing.sm,
    textAlign: 'center',
  },
})

