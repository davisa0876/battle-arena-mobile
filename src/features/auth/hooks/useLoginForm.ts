import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useFormSubmission } from '@/src/shared/hooks/useFormSubmission'
import { validateEmail, required } from '@/src/shared/lib/validation'

import { useAuth } from './AuthContext'

const FIELDS = ['email', 'password', 'device_name'] as const
type Field = 'email' | 'password'

export function useLoginForm() {
  const { t } = useTranslation()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [clientErrors, setClientErrors] = useState<Partial<Record<Field, string>>>({})
  const submission = useFormSubmission(FIELDS)

  const submit = useCallback(async () => {
    const keys = {
      email: validateEmail(email),
      password: required(password),
    }
    const errors: Partial<Record<Field, string>> = {}
    for (const field of ['email', 'password'] as const) {
      const key = keys[field]
      if (key) {
        errors[field] = t(key)
      }
    }
    setClientErrors(errors)

    if (Object.keys(errors).length > 0) {
      return
    }

    await submission.run(() => signIn({ email: email.trim(), password }))
  }, [email, password, signIn, submission, t])

  return {
    email,
    password,
    setEmail: (value: string) => {
      setEmail(value)
      setClientErrors((current) => ({ ...current, email: undefined }))
      submission.clearFieldError('email')
    },
    setPassword: (value: string) => {
      setPassword(value)
      setClientErrors((current) => ({ ...current, password: undefined }))
      submission.clearFieldError('password')
    },
    errorFor: (field: Field) => clientErrors[field] ?? submission.fieldError(field),
    formError: submission.formError,
    submitting: submission.submitting,
    submit,
  }
}
