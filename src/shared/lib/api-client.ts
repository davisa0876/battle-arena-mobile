import i18n, { normalizeLanguage } from '@/src/i18n';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function acceptLanguage(): string {
  return normalizeLanguage(i18n.resolvedLanguage ?? i18n.language);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE_URL) {
    throw new ApiError(i18n.t('errors.apiBaseUrl'));
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        'Accept-Language': acceptLanguage(),
        ...init?.headers,
      },
    });

    if (!response.ok) {
      throw new ApiError(`API request failed with status ${response.status}`, response.status);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(i18n.t('errors.apiOffline'), undefined, error);
  }
}

export const apiClient = {
  get<T>(path: string, signal?: AbortSignal): Promise<T> {
    return request<T>(path, { method: 'GET', signal });
  },
};
