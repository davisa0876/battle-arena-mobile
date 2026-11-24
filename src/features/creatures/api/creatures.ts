import { apiClient } from '@/src/shared/lib/api-client';

import type {
  CreatureDetailResponse,
  CreatureListParams,
  CreatureTypesResponse,
  PaginatedCreatures,
} from '../types';

function toQuery(params: CreatureListParams): string {
  const query: string[] = [];

  if (params.search?.trim()) {
    query.push(`search=${encodeURIComponent(params.search.trim())}`);
  }
  if (params.type?.trim()) {
    query.push(`type=${encodeURIComponent(params.type.trim())}`);
  }
  if (params.page && params.page > 0) {
    query.push(`page=${params.page}`);
  }
  if (params.per_page && params.per_page > 0) {
    query.push(`per_page=${params.per_page}`);
  }

  return query.length ? `?${query.join('&')}` : '';
}

export async function fetchCreatures(
  params: CreatureListParams = {},
  signal?: AbortSignal,
): Promise<PaginatedCreatures> {
  return apiClient.get<PaginatedCreatures>(`/api/creatures${toQuery(params)}`, signal);
}

export async function fetchCreatureBySlug(
  slug: string,
  signal?: AbortSignal,
): Promise<CreatureDetailResponse> {
  return apiClient.get<CreatureDetailResponse>(`/api/creatures/${encodeURIComponent(slug)}`, signal);
}

export async function fetchCreatureTypes(signal?: AbortSignal): Promise<CreatureTypesResponse> {
  return apiClient.get<CreatureTypesResponse>('/api/creature-types', signal);
}
