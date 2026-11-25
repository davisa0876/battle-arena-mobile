import { Platform } from 'react-native'

import { apiClient } from '@/src/shared/lib/api-client'

import type {
  AuthSessionResponse,
  AuthUserResponse,
  LoginPayload,
  MessageResponse,
  RegisterPayload,
  ResetPasswordPayload,
} from '../types'

/** Sent so the API issues a personal access token instead of a cookie session. */
const DEVICE_NAME = `expo-${Platform.OS}`

export function login(payload: LoginPayload): Promise<AuthSessionResponse> {
  return apiClient.post<AuthSessionResponse>(
    '/api/login',
    { ...payload, device_name: DEVICE_NAME },
    { skipAuth: true },
  )
}

export function register(payload: RegisterPayload): Promise<AuthSessionResponse> {
  return apiClient.post<AuthSessionResponse>(
    '/api/register',
    { ...payload, device_name: DEVICE_NAME },
    { skipAuth: true },
  )
}

export function logout(): Promise<MessageResponse> {
  return apiClient.post<MessageResponse>('/api/logout')
}

export function fetchMe(signal?: AbortSignal): Promise<AuthUserResponse> {
  return apiClient.get<AuthUserResponse>('/api/me', signal)
}

export function forgotPassword(email: string): Promise<MessageResponse> {
  return apiClient.post<MessageResponse>('/api/forgot-password', { email }, { skipAuth: true })
}

export function resetPassword(payload: ResetPasswordPayload): Promise<MessageResponse> {
  return apiClient.post<MessageResponse>('/api/reset-password', payload, { skipAuth: true })
}
