import { router } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useAuth } from '@/src/features/auth'
import { fetchCreatureBySlug } from '@/src/features/creatures/api/creatures'
import type { Creature } from '@/src/features/creatures/types'
import { useGameRules } from '@/src/features/gameRules'
import { ApiError } from '@/src/shared/lib/api-client'

import { selectStarter } from '../api/collection'

export type StarterOptionsState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; starters: Creature[] }

export function useStarterSelection() {
  const { t } = useTranslation()
  const { refreshUser } = useAuth()
  const [retryToken, setRetryToken] = useState(0)
  const rules = useGameRules(retryToken)
  const [options, setOptions] = useState<StarterOptionsState>({ status: 'loading' })
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const slugs = rules.status === 'ready' ? rules.rules.starters.creature_slugs : null
  const rulesError = rules.status === 'error' ? rules.message : null

  useEffect(() => {
    if (rulesError) {
      setOptions({ status: 'error', message: rulesError })
      return
    }

    if (!slugs) {
      setOptions({ status: 'loading' })
      return
    }

    const controller = new AbortController()
    setOptions({ status: 'loading' })

    Promise.allSettled(slugs.map((slug) => fetchCreatureBySlug(slug, controller.signal))).then((results) => {
      if (controller.signal.aborted) {
        return
      }

      const starters = results.flatMap((result) =>
        result.status === 'fulfilled' ? [result.value.data] : [],
      )

      setOptions(
        starters.length > 0
          ? { status: 'ready', starters }
          : { status: 'error', message: t('errors.startersLoad') },
      )
    })

    return () => controller.abort()
  }, [rulesError, slugs, t])

  const retry = useCallback(() => setRetryToken((value) => value + 1), [])

  const confirm = useCallback(async () => {
    if (!selectedSlug) {
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await selectStarter(selectedSlug)
      await refreshUser()
      router.replace('/my-collection')
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 409) {
        // Already has a starter: sync profile state and show the collection.
        await refreshUser()
        router.replace('/my-collection')
        return
      }

      setError(cause instanceof ApiError ? cause.message : t('errors.starterSelect'))
    } finally {
      setSubmitting(false)
    }
  }, [refreshUser, selectedSlug, t])

  return { options, selectedSlug, setSelectedSlug, submitting, error, confirm, retry }
}
