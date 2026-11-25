import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ApiError } from '@/src/shared/lib/api-client'

import { fetchMyCreatures, selectActiveCreature } from '../api/collection'
import type { OwnedCreature } from '../types'

export type CollectionState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; creatures: OwnedCreature[] }

export function useMyCollection() {
  const { t, i18n } = useTranslation()
  const [state, setState] = useState<CollectionState>({ status: 'loading' })
  const [reloadToken, setReloadToken] = useState(0)
  const [activatingId, setActivatingId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    fetchMyCreatures(controller.signal)
      .then((response) => setState({ status: 'ready', creatures: response.data }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return
        }

        setState({
          status: 'error',
          message: error instanceof ApiError ? error.message : t('errors.collectionLoad'),
        })
      })

    return () => controller.abort()
  }, [i18n.resolvedLanguage, reloadToken, t])

  const reload = useCallback(() => {
    setState({ status: 'loading' })
    setReloadToken((value) => value + 1)
  }, [])

  const setActive = useCallback(
    async (id: number) => {
      setActivatingId(id)
      setActionError(null)

      try {
        await selectActiveCreature(id)
        setReloadToken((value) => value + 1)
      } catch (error) {
        setActionError(error instanceof ApiError ? error.message : t('errors.selectActive'))
      } finally {
        setActivatingId(null)
      }
    },
    [t],
  )

  return { state, reload, setActive, activatingId, actionError }
}
