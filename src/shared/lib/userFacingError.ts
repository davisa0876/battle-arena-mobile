import { ApiError } from './api-client'

/**
 * Maps any thrown value to a safe, localized string for UI.
 * Technical details stay in the console — never Alert/render stacks, env var names, or HTTP status codes.
 * Pattern aligned with Horus platform-app (`useErrorHandler` + Global toast).
 */
export function toUserFacingMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    console.error('[api]', error.message, { status: error.status, cause: error.cause })
    const message = error.message.trim()
    // Config / transport anti-patterns that must never reach players.
    if (/EXPO_PUBLIC_|status \d{3}|timed out after/i.test(message)) {
      return fallback
    }
    return message || fallback
  }

  console.error('[api]', error)
  return fallback
}
