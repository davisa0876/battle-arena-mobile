import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useAuth, type AuthUser } from '@/src/features/auth'
import { useFormSubmission } from '@/src/shared/hooks/useFormSubmission'
import { validateBio, validateDisplayName, validateHandle } from '@/src/shared/lib/validation'

import { updateProfile } from '../api/profile'

const FIELDS = ['handle', 'display_name', 'bio', 'collection_is_public'] as const
type Field = 'handle' | 'display_name' | 'bio'

export function useProfileForm(user: AuthUser, onSaved: () => void) {
  const { t } = useTranslation()
  const { replaceUser } = useAuth()
  const profile = user.profile
  const [handle, setHandle] = useState(profile?.handle ?? '')
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [collectionIsPublic, setCollectionIsPublic] = useState(profile?.collection_is_public ?? false)
  const [clientErrors, setClientErrors] = useState<Partial<Record<Field, string>>>({})
  const submission = useFormSubmission(FIELDS)

  const clear = useCallback(
    (field: Field) => {
      setClientErrors((current) => ({ ...current, [field]: undefined }))
      submission.clearFieldError(field)
    },
    [submission],
  )

  const submit = useCallback(async () => {
    const keys = {
      handle: validateHandle(handle),
      display_name: validateDisplayName(displayName),
      bio: validateBio(bio),
    }
    const errors: Partial<Record<Field, string>> = {}
    for (const field of Object.keys(keys) as Field[]) {
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
      updateProfile({
        handle: handle.trim().toLowerCase(),
        display_name: displayName.trim(),
        bio: bio.trim() === '' ? null : bio.trim(),
        collection_is_public: collectionIsPublic,
      }),
    )

    if (result.ok) {
      replaceUser(result.value.data)
      onSaved()
    }
  }, [bio, collectionIsPublic, displayName, handle, onSaved, replaceUser, submission, t])

  return {
    handle,
    displayName,
    bio,
    collectionIsPublic,
    setHandle: (value: string) => {
      setHandle(value)
      clear('handle')
    },
    setDisplayName: (value: string) => {
      setDisplayName(value)
      clear('display_name')
    },
    setBio: (value: string) => {
      setBio(value)
      clear('bio')
    },
    setCollectionIsPublic,
    errorFor: (field: Field) => clientErrors[field] ?? submission.fieldError(field),
    formError: submission.formError,
    submitting: submission.submitting,
    submit,
  }
}
