import { Link } from 'expo-router'
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
import { useForgotPasswordForm } from '../hooks/useForgotPasswordForm'

export function ForgotPasswordScreen() {
  const { t } = useTranslation()
  const form = useForgotPasswordForm()

  return (
    <Screen keyboardAware>
      <BackButton fallbackHref="/login" />
      <AuthHeading
        eyebrow={t('auth.eyebrow')}
        title={t('auth.forgot.title')}
        description={t('auth.forgot.description')}
      />

      {form.formError ? <MessageBox tone="error" message={form.formError} /> : null}
      {form.sentMessage ? <MessageBox tone="success" message={form.sentMessage} /> : null}

      <FormField
        autoComplete="email"
        error={form.emailError}
        keyboardType="email-address"
        label={t('auth.fields.email')}
        onChangeText={form.setEmail}
        onSubmitEditing={() => void form.submit()}
        returnKeyType="send"
        textContentType="emailAddress"
        value={form.email}
      />

      <ActionButton loading={form.submitting} onPress={() => void form.submit()}>
        {t('auth.forgot.submit')}
      </ActionButton>

      <View style={styles.links}>
        <Link href="/login" style={styles.link}>
          {t('auth.backToLogin')}
        </Link>
      </View>
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
