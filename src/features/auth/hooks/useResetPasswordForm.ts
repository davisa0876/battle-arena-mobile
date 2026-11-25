import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useFormSubmission } from '@/src/shared/hooks/useFormSubmission'
import {
  required,
  validateConfirmation,
  validateEmail,
  validateNewPassword,
} from '@/src/shared/lib/validation'

import { resetPassword } from '../api/auth'

const FIELDS = ['token', 'email', 'password', 'password_confirmation'] as const

export type ResetField = 'token' | 'email' | 'password' | 'password_confirmation'

interface Initial {
  token?: string
  email?: string
}

export function useResetPasswordForm(initial: Initial) {
  const { t } = useTranslation()
  const [values, setValues] = useState({
    token: initial.token ?? '',
    email: initial.email ?? '',
    password: '',
    password_confirmation: '',
  })
  const [clientErrors, setClientErrors] = useState<Partial<Record<ResetField, string>>>({})
  const [doneMessage, setDoneMessage] = useState<string | null>(null)
  const submission = useFormSubmission(FIELDS)

  const setValue = useCallback(
    (field: ResetField, value: string) => {
      setValues((current) => ({ ...current, [field]: value }))
      setClientErrors((current) => ({ ...current, [field]: undefined }))
      submission.clearFieldError(field)
    },
    [submission],
  )

  const submit = useCallback(async () => {
    const keys = {
      token: required(values.token),
      email: validateEmail(values.email),
      password: validateNewPassword(values.password),
      password_confirmation: validateConfirmation(values.password, values.password_confirmation),
    }
    const errors: Partial<Record<ResetField, string>> = {}
    for (const field of Object.keys(keys) as ResetField[]) {
      const key = keys[field]
      if (key) {
        errors[field] = t(key)
      }
    }
    setClientErrors(errors)

    if (Object.keys(errors).length > 0) {
      return
    }

    const result = await submission.run(() =>
      resetPassword({
        token: values.token.trim(),
        email: values.email.trim(),
        password: values.password,
        password_confirmation: values.password_confirmation,
      }),
    )

    if (result.ok) {
      setDoneMessage(result.value?.message || t('auth.reset.done'))
    }
  }, [submission, t, values])

  return {
    values,
    setValue,
    errorFor: (field: ResetField) => clientErrors[field] ?? submission.fieldError(field),
    formError: submission.formError,
    doneMessage,
    submitting: submission.submitting,
    submit,
  }
}
