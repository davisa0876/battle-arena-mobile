import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react'

import { ApiError, setAccessTokenGetter, setUnauthorizedHandler } from '@/src/shared/lib/api-client'
import i18n from '@/src/i18n'

import * as authApi from '../api/auth'
import { AuthContext, type AuthContextValue, type AuthStatus } from '../hooks/AuthContext'
import { clearStoredToken, getStoredToken, storeToken } from '../lib/token-storage'
import type { AuthSessionResponse, AuthUser, LoginPayload, RegisterPayload } from '../types'

// The API client reads the bearer token from SecureStore through this getter.
setAccessTokenGetter(getStoredToken)

async function persistSession(response: AuthSessionResponse): Promise<AuthUser> {
  const token = response.meta?.token

  if (!token) {
    throw new ApiError(i18n.t('errors.tokenMissing'))
  }

  try {
    await storeToken(token)
  } catch (error) {
    throw new ApiError(i18n.t('errors.secureStorage'), undefined, error)
  }

  return response.data
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<AuthUser | null>(null)
  const [restoreFailed, setRestoreFailed] = useState(false)
  const [restoreAttempt, setRestoreAttempt] = useState(0)

  const clearSession = useCallback(() => {
    void clearStoredToken()
    setUser(null)
    setStatus('unauthenticated')
  }, [])

  // Any authenticated request that returns 401 drops the session.
  useEffect(() => {
    setUnauthorizedHandler(clearSession)
    return () => setUnauthorizedHandler(null)
  }, [clearSession])

  // Restore the session on launch (and when the user retries after a network failure).
  useEffect(() => {
    const controller = new AbortController()

    async function restore() {
      const token = await getStoredToken()

      if (controller.signal.aborted) {
        return
      }

      if (!token) {
        setRestoreFailed(false)
        setStatus('unauthenticated')
        return
      }

      try {
        const response = await authApi.fetchMe(controller.signal)
        if (controller.signal.aborted) {
          return
        }
        setUser(response.data)
        setRestoreFailed(false)
        setStatus('authenticated')
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }

        if (error instanceof ApiError && error.status === 401) {
          clearSession()
          setRestoreFailed(false)
          return
        }

        // API unreachable or failing: keep the token, let the user retry.
        setRestoreFailed(true)
        setUser(null)
        setStatus('unauthenticated')
      }
    }

    void restore()

    return () => controller.abort()
  }, [clearSession, restoreAttempt])

  const signIn = useCallback(async (payload: LoginPayload) => {
    const nextUser = await persistSession(await authApi.login(payload))
    setUser(nextUser)
    setRestoreFailed(false)
    setStatus('authenticated')
    return nextUser
  }, [])

  const signUp = useCallback(async (payload: RegisterPayload) => {
    const nextUser = await persistSession(await authApi.register(payload))
    setUser(nextUser)
    setRestoreFailed(false)
    setStatus('authenticated')
    return nextUser
  }, [])

  const signOut = useCallback(async () => {
    // Drop local session first so PvpPresenceKeeper closes the WS immediately.
    clearSession()
    try {
      await authApi.logout()
    } catch {
      // Already signed out locally; server presence clear may have failed.
    }
  }, [clearSession])

  const refreshUser = useCallback(async () => {
    try {
      const response = await authApi.fetchMe()
      setUser(response.data)
      setStatus('authenticated')
      return response.data
    } catch {
      return null
    }
  }, [])

  const replaceUser = useCallback((nextUser: AuthUser) => {
    setUser(nextUser)
  }, [])

  const retryRestore = useCallback(() => {
    setStatus('loading')
    setRestoreAttempt((value) => value + 1)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      restoreFailed,
      signIn,
      signUp,
      signOut,
      refreshUser,
      replaceUser,
      retryRestore,
    }),
    [status, user, restoreFailed, signIn, signUp, signOut, refreshUser, replaceUser, retryRestore],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
