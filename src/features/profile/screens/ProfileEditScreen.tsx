import { router } from 'expo-router'
import { StyleSheet, Switch, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { RequireAuth, useAuth, type AuthUser } from '@/src/features/auth'
import { ActionButton } from '@/src/shared/components/ActionButton'
import { Avatar } from '@/src/shared/components/Avatar'
import { BackButton } from '@/src/shared/components/BackButton'
import { FormField } from '@/src/shared/components/FormField'
import { MessageBox } from '@/src/shared/components/MessageBox'
import { Screen } from '@/src/shared/components/Screen'
import { colors } from '@/src/theme/colors'
import { spacing } from '@/src/theme/spacing'

import { useAvatarUpload } from '../hooks/useAvatarUpload'
import { usePasswordForm } from '../hooks/usePasswordForm'
import { useProfileForm } from '../hooks/useProfileForm'

function goToProfile() {
  if (router.canGoBack()) {
    router.back()
  } else {
    router.replace('/profile')
  }
}

function ProfileEditForm({ user }: { user: AuthUser }) {
  const { t } = useTranslation()
  const form = useProfileForm(user, goToProfile)
  const passwordForm = usePasswordForm()
  const avatar = useAvatarUpload()
  const profile = user.profile

  return (
    <Screen keyboardAware>
      <BackButton fallbackHref="/profile" />
      <Text style={styles.eyebrow}>{t('profile.eyebrow')}</Text>
      <Text accessibilityRole="header" style={styles.title}>
        {t('profile.editTitle')}
      </Text>

      <View style={styles.avatarRow}>
        <Avatar name={profile?.display_name ?? user.email} url={profile?.avatar_url} size={88} />
        <View style={styles.avatarActions}>
          <ActionButton variant="secondary" loading={avatar.busy} onPress={() => void avatar.pickAndUpload()}>
            {t('profile.avatar.change')}
          </ActionButton>
          {profile?.avatar_url ? (
            <ActionButton variant="danger" disabled={avatar.busy} onPress={() => void avatar.remove()}>
              {t('profile.avatar.remove')}
            </ActionButton>
          ) : null}
        </View>
      </View>
      <Text style={styles.avatarHint}>{t('profile.avatar.hint')}</Text>
      {avatar.error ? <MessageBox tone="error" message={avatar.error} /> : null}

      {form.formError ? <MessageBox tone="error" message={form.formError} /> : null}

      <FormField
        error={form.errorFor('display_name')}
        autoCapitalize="words"
        label={t('auth.fields.displayName')}
        onChangeText={form.setDisplayName}
        returnKeyType="next"
        value={form.displayName}
      />
      <FormField
        error={form.errorFor('handle')}
        hint={t('auth.fields.handleHint')}
        label={t('auth.fields.handle')}
        onChangeText={form.setHandle}
        returnKeyType="next"
        value={form.handle}
      />
      <FormField
        autoCapitalize="sentences"
        autoCorrect
        error={form.errorFor('bio')}
        hint={t('profile.bioHint', { length: form.bio.length })}
        label={t('profile.bio')}
        maxLength={500}
        multiline
        onChangeText={form.setBio}
        textAlignVertical="top"
        value={form.bio}
      />

      <View style={styles.switchRow}>
        <View style={styles.switchText}>
          <Text style={styles.switchLabel}>{t('profile.publicCollection')}</Text>
          <Text style={styles.switchHint}>{t('profile.publicCollectionHint')}</Text>
        </View>
        <Switch
          accessibilityLabel={t('profile.publicCollection')}
          onValueChange={form.setCollectionIsPublic}
          thumbColor={form.collectionIsPublic ? colors.ember : colors.textMuted}
          trackColor={{ false: colors.border, true: colors.surfaceRaised }}
          value={form.collectionIsPublic}
        />
      </View>

      <View style={styles.actions}>
        <ActionButton loading={form.submitting} onPress={() => void form.submit()}>
          {t('common.save')}
        </ActionButton>
        <ActionButton variant="secondary" disabled={form.submitting} onPress={goToProfile}>
          {t('common.cancel')}
        </ActionButton>
      </View>

      <Text style={styles.sectionTitle}>{t('profile.password.title')}</Text>
      {passwordForm.formError ? <MessageBox tone="error" message={passwordForm.formError} /> : null}
      {passwordForm.success ? <MessageBox tone="success" message={passwordForm.success} /> : null}
      <FormField
        password
        error={passwordForm.errorFor('current_password')}
        label={t('profile.password.current')}
        onChangeText={passwordForm.setCurrentPassword}
        value={passwordForm.currentPassword}
      />
      <FormField
        password
        error={passwordForm.errorFor('password')}
        label={t('profile.password.next')}
        onChangeText={passwordForm.setPassword}
        value={passwordForm.password}
      />
      <FormField
        password
        error={passwordForm.errorFor('password_confirmation')}
        label={t('profile.password.confirm')}
        onChangeText={passwordForm.setPasswordConfirmation}
        value={passwordForm.passwordConfirmation}
      />
      <ActionButton loading={passwordForm.submitting} onPress={() => void passwordForm.submit()}>
        {t('profile.password.submit')}
      </ActionButton>
    </Screen>
  )
}

function ProfileEditGate() {
  const { user } = useAuth()
  return user ? <ProfileEditForm user={user} /> : null
}

export function ProfileEditScreen() {
  return (
    <RequireAuth>
      <ProfileEditGate />
    </RequireAuth>
  )
}

const styles = StyleSheet.create({
  eyebrow: {
    color: colors.ember,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  avatarRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.lg,
  },
  avatarActions: {
    flex: 1,
    gap: spacing.sm,
  },
  avatarHint: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  switchRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
    padding: spacing.lg,
  },
  switchText: {
    flex: 1,
  },
  switchLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  switchHint: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  actions: {
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: spacing.md,
    marginTop: spacing.xxl,
  },
})

