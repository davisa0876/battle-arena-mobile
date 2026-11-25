import { createContext, useContext } from 'react'

import type { AuthUser, LoginPayload, RegisterPayload } from '../types'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export interface AuthContextValue {
  status: AuthStatus
  user: AuthUser | null
  /** True when a stored token exists but the session could not be verified (e.g. API offline). */
  restoreFailed: boolean
  signIn: (payload: LoginPayload) => Promise<AuthUser>
  signUp: (payload: RegisterPayload) => Promise<AuthUser>
  signOut: () => Promise<void>
  refreshUser: () => Promise<AuthUser | null>
  replaceUser: (user: AuthUser) => void
  retryRestore: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
