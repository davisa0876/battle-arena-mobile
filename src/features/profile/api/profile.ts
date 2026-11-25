import type { AuthUserResponse } from '@/src/features/auth/types'
import { apiClient } from '@/src/shared/lib/api-client'

import type { PublicPlayerResponse, UpdateProfilePayload } from '../types'

export function updateProfile(payload: UpdateProfilePayload): Promise<AuthUserResponse> {
  return apiClient.patch<AuthUserResponse>('/api/me/profile', payload)
}

export function uploadAvatar(form: FormData): Promise<AuthUserResponse> {
  return apiClient.postForm<AuthUserResponse>('/api/me/avatar', form)
}

export function deleteAvatar(): Promise<AuthUserResponse> {
  return apiClient.delete<AuthUserResponse>('/api/me/avatar')
}

export function fetchPublicPlayer(handle: string, signal?: AbortSignal): Promise<PublicPlayerResponse> {
  return apiClient.get<PublicPlayerResponse>(`/api/players/${encodeURIComponent(handle)}`, signal)
}

export interface UpdatePasswordPayload {
  current_password: string
  password: string
  password_confirmation: string
}

export function updatePassword(payload: UpdatePasswordPayload): Promise<{ message: string }> {
  return apiClient.patch<{ message: string }>('/api/me/password', payload)
}

export function resendVerificationEmail(): Promise<{ message: string }> {
  return apiClient.post<{ message: string }>('/api/email/verification-notification')
}
