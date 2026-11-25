import * as ImagePicker from 'expo-image-picker'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useAuth } from '@/src/features/auth'
import { ApiError } from '@/src/shared/lib/api-client'

import { buildAvatarForm, prepareAvatar } from '../api/avatar-image'
import { deleteAvatar, uploadAvatar } from '../api/profile'

export function useAvatarUpload() {
  const { t } = useTranslation()
  const { replaceUser } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fail = useCallback(
    (cause: unknown) => {
      setError(cause instanceof ApiError ? cause.message : t('errors.avatarUpload'))
    },
    [t],
  )

  const pickAndUpload = useCallback(async () => {
    setError(null)

    let result: ImagePicker.ImagePickerResult
    try {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      })
    } catch (cause) {
      fail(cause)
      return
    }

    const asset = result.canceled ? undefined : result.assets[0]
    if (!asset) {
      return
    }

    setBusy(true)
    try {
      const file = await prepareAvatar(asset)
      const response = await uploadAvatar(buildAvatarForm(file))
      replaceUser(response.data)
    } catch (cause) {
      fail(cause)
    } finally {
      setBusy(false)
    }
  }, [fail, replaceUser])

  const remove = useCallback(async () => {
    setError(null)
    setBusy(true)
    try {
      const response = await deleteAvatar()
      replaceUser(response.data)
    } catch (cause) {
      fail(cause)
    } finally {
      setBusy(false)
    }
  }, [fail, replaceUser])

  return { busy, error, pickAndUpload, remove }
}
