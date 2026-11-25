import { Link } from 'expo-router'
import { StyleSheet, Text } from 'react-native'
import { useTranslation } from 'react-i18next'

import { ActionButton } from '@/src/shared/components/ActionButton'
import { FormField } from '@/src/shared/components/FormField'
import { MessageBox } from '@/src/shared/components/MessageBox'
import { Screen } from '@/src/shared/components/Screen'
import { colors } from '@/src/theme/colors'
import { spacing } from '@/src/theme/spacing'

import { AuthHeading } from '../components/AuthHeading'
import { GuestOnly } from '../components/AuthGuards'
import { useRegisterForm } from '../hooks/useRegisterForm'

function RegisterForm() {
  const { t } = useTranslation()
  const form = useRegisterForm()

  return (
    <Screen keyboardAware>
      <AuthHeading
        eyebrow={t('auth.eyebrow')}
        title={t('auth.register.title')}
        description={t('auth.register.description')}
      />

      {form.formError ? <MessageBox tone="error" message={form.formError} /> : null}

      <FormField
        autoComplete="username-new"
        error={form.errorFor('handle')}
        hint={t('auth.fields.handleHint')}
        label={t('auth.fields.handle')}
        onChangeText={(value) => form.setValue('handle', value)}
        returnKeyType="next"
        value={form.values.handle}
      />
      <FormField
        autoCapitalize="words"
        error={form.errorFor('display_name')}
        hint={t('auth.fields.displayNameHint')}
        label={t('auth.fields.displayName')}
        onChangeText={(value) => form.setValue('display_name', value)}
        returnKeyType="next"
        value={form.values.display_name}
      />
      <FormField
        autoComplete="email"
        error={form.errorFor('email')}
        keyboardType="email-address"
        label={t('auth.fields.email')}
        onChangeText={(value) => form.setValue('email', value)}
        returnKeyType="next"
        textContentType="emailAddress"
        value={form.values.email}
      />
      <FormField
        autoComplete="password-new"
        error={form.errorFor('password')}
        hint={t('auth.fields.passwordHint')}
        label={t('auth.fields.password')}
        onChangeText={(value) => form.setValue('password', value)}
        password
        returnKeyType="next"
        textContentType="newPassword"
        value={form.values.password}
      />
      <FormField
        autoComplete="password-new"
        error={form.errorFor('password_confirmation')}
        label={t('auth.fields.passwordConfirmation')}
        onChangeText={(value) => form.setValue('password_confirmation', value)}
        onSubmitEditing={() => void form.submit()}
        password
        returnKeyType="go"
        textContentType="newPassword"
        value={form.values.password_confirmation}
      />

      <ActionButton loading={form.submitting} onPress={() => void form.submit()}>
        {t('auth.register.submit')}
      </ActionButton>

      <Text style={styles.muted}>
        {t('auth.register.haveAccount')}{' '}
        <Link href="/login" style={styles.link}>
          {t('auth.register.signIn')}
        </Link>
      </Text>
    </Screen>
  )
}

export function RegisterScreen() {
  return (
    <GuestOnly>
      <RegisterForm />
    </GuestOnly>
  )
}

const styles = StyleSheet.create({
  link: {
    color: colors.electric,
    fontWeight: '700',
  },
  muted: {
    color: colors.textMuted,
    marginTop: spacing.xl,
  },
})
