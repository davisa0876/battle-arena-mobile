import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

const TOKEN_KEY = 'battle-arena.auth-token'

/**
 * Bearer tokens are stored in expo-secure-store only. On web (where SecureStore is
 * unavailable) the token is kept in memory for the session; it is never written to
 * AsyncStorage or localStorage.
 */
let memoryToken: string | null | undefined

const useMemoryOnly = Platform.OS === 'web'

export async function getStoredToken(): Promise<string | null> {
  if (memoryToken !== undefined) {
    return memoryToken
  }

  if (useMemoryOnly) {
    memoryToken = null
    return null
  }

  try {
    memoryToken = await SecureStore.getItemAsync(TOKEN_KEY)
    return memoryToken
  } catch {
    // Do not cache a read failure so a later request can retry.
    return null
  }
}

export async function storeToken(token: string): Promise<void> {
  memoryToken = token

  if (useMemoryOnly) {
    return
  }

  await SecureStore.setItemAsync(TOKEN_KEY, token)
}

export async function clearStoredToken(): Promise<void> {
  memoryToken = null

  if (useMemoryOnly) {
    return
  }

  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY)
  } catch {
    // Nothing else to clean up; the in-memory copy is already cleared.
  }
}
