import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ApiError } from '@/src/shared/lib/api-client'

import { fetchGameRules } from '../api/gameRules'
import type { GameRules } from '../types'

export type GameRulesState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; rules: GameRules }

export function useGameRules(retryToken = 0): GameRulesState {
  const { t, i18n } = useTranslation()
  const [state, setState] = useState<GameRulesState>({ status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()
    setState({ status: 'loading' })

    fetchGameRules(controller.signal)
      .then((response) => setState({ status: 'ready', rules: response.data }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return
        }

        setState({
          status: 'error',
          message: error instanceof ApiError ? error.message : t('errors.gameRulesLoad'),
        })
      })

    return () => controller.abort()
  }, [i18n.resolvedLanguage, retryToken, t])

  return state
}
