import { Link } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { MessageBox } from '@/src/shared/components/MessageBox'
import { ActionButton } from '@/src/shared/components/ActionButton'
import { FormField } from '@/src/shared/components/FormField'
import { Screen } from '@/src/shared/components/Screen'
import { colors } from '@/src/theme/colors'
import { spacing } from '@/src/theme/spacing'

import { AuthHeading } from '../components/AuthHeading'
import { GuestOnly } from '../components/AuthGuards'
import { useAuth } from '../hooks/AuthContext'
import { useLoginForm } from '../hooks/useLoginForm'

function LoginForm() {
  const { t } = useTranslation()
  const { restoreFailed, retryRestore } = useAuth()
  const form = useLoginForm()

  return (
    <Screen keyboardAware>
      <AuthHeading
        eyebrow={t('auth.eyebrow')}
        title={t('auth.login.title')}
        description={t('auth.login.description')}
      />

      {restoreFailed ? (
        <MessageBox tone="info" message={t('auth.restoreFailed')} onRetry={retryRestore} />
      ) : null}
      {form.formError ? <MessageBox tone="error" message={form.formError} /> : null}

      <FormField
        autoComplete="email"
        error={form.errorFor('email')}
        keyboardType="email-address"
        label={t('auth.fields.email')}
        onChangeText={form.setEmail}
        returnKeyType="next"
        textContentType="emailAddress"
        value={form.email}
      />
      <FormField
        autoComplete="current-password"
        error={form.errorFor('password')}
        label={t('auth.fields.password')}
        onChangeText={form.setPassword}
        onSubmitEditing={() => void form.submit()}
        password
        returnKeyType="go"
        textContentType="password"
        value={form.password}
      />

      <ActionButton loading={form.submitting} onPress={() => void form.submit()}>
        {t('auth.login.submit')}
      </ActionButton>

      <View style={styles.links}>
        <Link href="/forgot-password" style={styles.link}>
          {t('auth.login.forgot')}
        </Link>
        <Text style={styles.muted}>
          {t('auth.login.noAccount')}{' '}
          <Link href="/register" style={styles.link}>
            {t('auth.login.createAccount')}
          </Link>
        </Text>
      </View>
    </Screen>
  )
}

export function LoginScreen() {
  return (
    <GuestOnly>
      <LoginForm />
    </GuestOnly>
  )
}

const styles = StyleSheet.create({
  links: {
    gap: spacing.lg,
    marginTop: spacing.xl,
  },
  link: {
    color: colors.electric,
    fontWeight: '700',
  },
  muted: {
    color: colors.textMuted,
  },
})
