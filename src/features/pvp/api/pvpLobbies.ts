import { apiClient } from '@/src/shared/lib/api-client'

import type { PvpInvitation, PvpOnlineOpponent, PvpRoom } from '../types'

function unwrapData<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data
  }
  return payload as T
}

function newKey(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export async function createPvpRoom(inviteeHandle: string): Promise<{ room: PvpRoom; invitation: PvpInvitation }> {
  const payload = await apiClient.post('/api/pvp/rooms', {
    invitee_handle: inviteeHandle,
    idempotency_key: newKey('pvp-create'),
  })
  return unwrapData(payload)
}

export async function listPvpOnlineOpponents(): Promise<PvpOnlineOpponent[]> {
  const payload = await apiClient.get('/api/pvp/online')
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: PvpOnlineOpponent[] }).data
  }
  return []
}

export async function listPvpInvitations(box: 'received' | 'sent'): Promise<PvpInvitation[]> {
  const payload = await apiClient.get(`/api/pvp/invitations?box=${box}`)
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: PvpInvitation[] }).data
  }
  return []
}

export async function acceptPvpInvitation(id: string): Promise<PvpRoom> {
  const payload = await apiClient.post(`/api/pvp/invitations/${encodeURIComponent(id)}/accept`, {
    idempotency_key: newKey('pvp-accept'),
  })
  return unwrapData(payload)
}

export async function declinePvpInvitation(id: string): Promise<unknown> {
  return apiClient.post(`/api/pvp/invitations/${encodeURIComponent(id)}/decline`, {
    idempotency_key: newKey('pvp-decline'),
  })
}

export async function cancelPvpInvitation(id: string): Promise<unknown> {
  return apiClient.post(`/api/pvp/invitations/${encodeURIComponent(id)}/cancel`, {
    idempotency_key: newKey('pvp-cancel'),
  })
}

export async function fetchPvpRoom(roomId: string): Promise<PvpRoom> {
  const payload = await apiClient.get(`/api/pvp/rooms/${encodeURIComponent(roomId)}`)
  return unwrapData(payload)
}

export async function leavePvpRoom(roomId: string): Promise<PvpRoom> {
  const payload = await apiClient.post(`/api/pvp/rooms/${encodeURIComponent(roomId)}/leave`, {
    idempotency_key: newKey('pvp-leave'),
  })
  return unwrapData(payload)
}

export async function issuePvpRoomGrant(roomId: string): Promise<{ grant: string; expires_in: number; room_id: string }> {
  const payload = await apiClient.post(`/api/pvp/rooms/${encodeURIComponent(roomId)}/subscription-grants`, {})
  return unwrapData(payload)
}

export async function issueRealtimeTicket(): Promise<{ ticket: string; expires_in: number; ws_url: string }> {
  const payload = await apiClient.post('/api/realtime/tickets', {})
  return unwrapData(payload)
}
