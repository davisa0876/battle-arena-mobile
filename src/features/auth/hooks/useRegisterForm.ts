import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useFormSubmission } from '@/src/shared/hooks/useFormSubmission'
import {
  validateConfirmation,
  validateDisplayName,
  validateEmail,
  validateHandle,
  validateNewPassword,
} from '@/src/shared/lib/validation'

import { useAuth } from './AuthContext'

const FIELDS = [
  'handle',
  'display_name',
  'email',
  'password',
  'password_confirmation',
  'device_name',
] as const

export type RegisterField = 'handle' | 'display_name' | 'email' | 'password' | 'password_confirmation'

const EMPTY = {
  handle: '',
  display_name: '',
  email: '',
  password: '',
  password_confirmation: '',
}

export function useRegisterForm() {
  const { t } = useTranslation()
  const { signUp } = useAuth()
  const [values, setValues] = useState(EMPTY)
  const [clientErrors, setClientErrors] = useState<Partial<Record<RegisterField, string>>>({})
  const submission = useFormSubmission(FIELDS)

  const setValue = useCallback(
    (field: RegisterField, value: string) => {
      setValues((current) => ({ ...current, [field]: value }))
      setClientErrors((current) => ({ ...current, [field]: undefined }))
      submission.clearFieldError(field)
    },
    [submission],
  )

  const submit = useCallback(async () => {
    const keys = {
      handle: validateHandle(values.handle),
      // Display name is optional on the API (defaults to the handle).
      display_name:
        values.display_name.trim() === '' ? undefined : validateDisplayName(values.display_name),
      email: validateEmail(values.email),
      password: validateNewPassword(values.password),
      password_confirmation: validateConfirmation(values.password, values.password_confirmation),
    }
    const errors: Partial<Record<RegisterField, string>> = {}
    for (const field of Object.keys(keys) as RegisterField[]) {
      const key = keys[field]
      if (key) {
        errors[field] = t(key)
      }
    }
    setClientErrors(errors)

    if (Object.keys(errors).length > 0) {
      return
    }

    const displayName = values.display_name.trim()
    await submission.run(() =>
      signUp({
        handle: values.handle.trim().toLowerCase(),
        email: values.email.trim(),
        password: values.password,
        password_confirmation: values.password_confirmation,
        ...(displayName ? { display_name: displayName } : {}),
      }),
    )
  }, [signUp, submission, t, values])

  return {
    values,
    setValue,
    errorFor: (field: RegisterField) => clientErrors[field] ?? submission.fieldError(field),
    formError: submission.formError,
    submitting: submission.submitting,
    submit,
  }
}
