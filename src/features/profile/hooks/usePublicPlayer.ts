import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ApiError } from '@/src/shared/lib/api-client'

import { fetchPublicPlayer } from '../api/profile'
import type { PublicPlayer } from '../types'

export type PublicPlayerState =
  | { status: 'loading' }
  | { status: 'error'; message: string; notFound: boolean }
  | { status: 'ready'; player: PublicPlayer }

export function usePublicPlayer(handle: string, retryToken: number): PublicPlayerState {
  const { t } = useTranslation()
  const [state, setState] = useState<PublicPlayerState>({ status: 'loading' })

  useEffect(() => {
    if (!handle) {
      setState({ status: 'error', message: t('profile.player.notFound'), notFound: true })
      return
    }

    const controller = new AbortController()
    setState({ status: 'loading' })

    fetchPublicPlayer(handle, controller.signal)
      .then((response) => setState({ status: 'ready', player: response.data }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return
        }

        if (error instanceof ApiError && error.status === 404) {
          setState({ status: 'error', message: t('profile.player.notFound'), notFound: true })
          return
        }

        setState({
          status: 'error',
          message: error instanceof ApiError ? error.message : t('errors.playerLoad'),
          notFound: false,
        })
      })

    return () => controller.abort()
  }, [handle, retryToken, t])

  return state
}
