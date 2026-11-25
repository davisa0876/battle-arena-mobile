import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ApiError, type FieldErrors } from '@/src/shared/lib/api-client'

/**
 * Shared submit state for forms: tracks the in-flight request, maps 422 validation errors
 * onto fields and exposes any other failure as a form-level message.
 */
export function useFormSubmission(knownFields: readonly string[]) {
  const { t } = useTranslation()
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [serverErrors, setServerErrors] = useState<FieldErrors>({})

  const run = useCallback(
    async <T>(action: () => Promise<T>): Promise<{ ok: true; value: T } | { ok: false }> => {
      setSubmitting(true)
      setFormError(null)
      setServerErrors({})

      try {
        const value = await action()
        return { ok: true, value }
      } catch (error) {
        if (error instanceof ApiError) {
          const keys = Object.keys(error.fieldErrors)
          const hasUnmapped = keys.length === 0 || keys.some((key) => !knownFields.includes(key))

          setServerErrors(error.fieldErrors)
          setFormError(hasUnmapped ? error.message : null)
        } else {
          setFormError(t('errors.unexpected'))
        }

        return { ok: false }
      } finally {
        setSubmitting(false)
      }
    },
    [knownFields, t],
  )

  const fieldError = useCallback((name: string) => serverErrors[name]?.[0], [serverErrors])

  const clearFieldError = useCallback((name: string) => {
    setServerErrors((current) => {
      if (!(name in current)) {
        return current
      }
      const { [name]: _removed, ...rest } = current
      return rest
    })
  }, [])

  return { submitting, formError, setFormError, fieldError, clearFieldError, run }
}
