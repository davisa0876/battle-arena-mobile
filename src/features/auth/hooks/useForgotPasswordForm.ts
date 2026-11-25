import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useFormSubmission } from '@/src/shared/hooks/useFormSubmission'
import { validateEmail } from '@/src/shared/lib/validation'

import { forgotPassword } from '../api/auth'

const FIELDS = ['email'] as const

export function useForgotPasswordForm() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [clientError, setClientError] = useState<string | undefined>()
  const [sentMessage, setSentMessage] = useState<string | null>(null)
  const submission = useFormSubmission(FIELDS)

  const submit = useCallback(async () => {
    const key = validateEmail(email)
    setClientError(key ? t(key) : undefined)
    setSentMessage(null)

    if (key) {
      return
    }

    const result = await submission.run(() => forgotPassword(email.trim()))
    if (result.ok) {
      setSentMessage(result.value?.message || t('auth.forgot.sent'))
    }
  }, [email, submission, t])

  return {
    email,
    setEmail: (value: string) => {
      setEmail(value)
      setClientError(undefined)
      submission.clearFieldError('email')
    },
    emailError: clientError ?? submission.fieldError('email'),
    formError: submission.formError,
    sentMessage,
    submitting: submission.submitting,
    submit,
  }
}
