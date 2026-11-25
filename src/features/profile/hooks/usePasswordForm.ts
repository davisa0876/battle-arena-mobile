import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useFormSubmission } from '@/src/shared/hooks/useFormSubmission'
import { validateConfirmation, validateNewPassword, required } from '@/src/shared/lib/validation'

import { updatePassword } from '../api/profile'

const FIELDS = ['current_password', 'password', 'password_confirmation'] as const

export function usePasswordForm() {
  const { t } = useTranslation()
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [success, setSuccess] = useState<string | null>(null)
  const submission = useFormSubmission(FIELDS)

  const submit = useCallback(async () => {
    setSuccess(null)

    const currentKey = required(currentPassword)
    const passwordKey = validateNewPassword(password)
    const confirmKey = validateConfirmation(password, passwordConfirmation)

    if (currentKey || passwordKey || confirmKey) {
      submission.setFormError(t(currentKey ?? passwordKey ?? confirmKey!))
      return
    }

    const result = await submission.run(() =>
      updatePassword({
        current_password: currentPassword,
        password,
        password_confirmation: passwordConfirmation,
      }),
    )

    if (result.ok) {
      setCurrentPassword('')
      setPassword('')
      setPasswordConfirmation('')
      setSuccess(result.value.message || t('profile.password.changed'))
    }
  }, [currentPassword, password, passwordConfirmation, submission, t])

  return {
    currentPassword,
    setCurrentPassword,
    password,
    setPassword,
    passwordConfirmation,
    setPasswordConfirmation,
    success,
    submitting: submission.submitting,
    formError: submission.formError,
    errorFor: submission.fieldError,
    submit,
  }
}
