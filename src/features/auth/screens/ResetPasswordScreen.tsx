import { Link, useLocalSearchParams } from 'expo-router'
import { StyleSheet, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { ActionButton } from '@/src/shared/components/ActionButton'
import { BackButton } from '@/src/shared/components/BackButton'
import { FormField } from '@/src/shared/components/FormField'
import { MessageBox } from '@/src/shared/components/MessageBox'
import { Screen } from '@/src/shared/components/Screen'
import { colors } from '@/src/theme/colors'
import { spacing } from '@/src/theme/spacing'

import { AuthHeading } from '../components/AuthHeading'
import { useResetPasswordForm } from '../hooks/useResetPasswordForm'

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export function ResetPasswordScreen() {
  const { t } = useTranslation()
  const params = useLocalSearchParams<{ token?: string | string[]; email?: string | string[] }>()
  const token = firstParam(params.token)
  const email = firstParam(params.email)
  const form = useResetPasswordForm({ token, email })

  return (
    <Screen keyboardAware>
      <BackButton fallbackHref="/login" />
      <AuthHeading
        eyebrow={t('auth.eyebrow')}
        title={t('auth.reset.title')}
        description={t('auth.reset.description')}
      />

      {form.formError ? <MessageBox tone="error" message={form.formError} /> : null}

      {form.doneMessage ? (
        <>
          <MessageBox tone="success" message={form.doneMessage} />
          <Link href="/login" style={styles.link}>
            {t('auth.backToLogin')}
          </Link>
        </>
      ) : (
        <>
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
          {token ? null : (
            <FormField
              error={form.errorFor('token')}
              hint={t('auth.reset.tokenHint')}
              label={t('auth.fields.resetToken')}
              onChangeText={(value) => form.setValue('token', value)}
              returnKeyType="next"
              value={form.values.token}
            />
          )}
          <FormField
            autoComplete="password-new"
            error={form.errorFor('password')}
            hint={t('auth.fields.passwordHint')}
            label={t('auth.fields.newPassword')}
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
            {t('auth.reset.submit')}
          </ActionButton>
          <View style={styles.links}>
            <Link href="/forgot-password" style={styles.link}>
              {t('auth.reset.requestNew')}
            </Link>
          </View>
        </>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  links: {
    marginTop: spacing.xl,
  },
  link: {
    color: colors.electric,
    fontWeight: '700',
  },
})
