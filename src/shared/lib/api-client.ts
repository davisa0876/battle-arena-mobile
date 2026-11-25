import i18n, { normalizeLanguage } from '@/src/i18n';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/+$/, '');

export type FieldErrors = Record<string, string[]>;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly cause?: unknown,
    readonly fieldErrors: FieldErrors = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface RequestOptions {
  signal?: AbortSignal;
  /** Do not attach the bearer token (login, register, password recovery). */
  skipAuth?: boolean;
}

type TokenGetter = () => Promise<string | null>;
type UnauthorizedHandler = () => void;

let tokenGetter: TokenGetter = async () => null;
let unauthorizedHandler: UnauthorizedHandler | null = null;

/** Registered by the auth feature; reads the bearer token from expo-secure-store. */
export function setAccessTokenGetter(getter: TokenGetter): void {
  tokenGetter = getter;
}

/** Registered by the auth feature; called when an authenticated request returns 401. */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
}

function acceptLanguage(): string {
  return normalizeLanguage(i18n.resolvedLanguage ?? i18n.language);
}

function parseFieldErrors(value: unknown): FieldErrors {
  if (!value || typeof value !== 'object') {
    return {};
  }

  const result: FieldErrors = {};
  for (const [field, messages] of Object.entries(value as Record<string, unknown>)) {
    if (Array.isArray(messages)) {
      result[field] = messages.filter((message): message is string => typeof message === 'string');
    } else if (typeof messages === 'string') {
      result[field] = [messages];
    }
  }

  return result;
}

async function readJson(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('json')) {
    return undefined;
  }

  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

function serverMessage(body: unknown): string | undefined {
  if (body && typeof body === 'object' && 'message' in body) {
    const message = (body as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  return undefined;
}

function toApiError(response: Response, body: unknown): ApiError {
  if (response.status === 422) {
    const fieldErrors = parseFieldErrors(
      body && typeof body === 'object' ? (body as { errors?: unknown }).errors : undefined,
    );
    const firstFieldMessage = Object.values(fieldErrors).flat()[0];

    return new ApiError(
      firstFieldMessage ?? serverMessage(body) ?? i18n.t('errors.validation'),
      422,
      undefined,
      fieldErrors,
    );
  }

  if (response.status === 401) {
    return new ApiError(serverMessage(body) ?? i18n.t('errors.unauthenticated'), 401);
  }

  if (response.status === 403) {
    return new ApiError(serverMessage(body) ?? i18n.t('errors.forbidden'), 403);
  }

  if (response.status === 404) {
    return new ApiError(serverMessage(body) ?? i18n.t('errors.resourceNotFound'), 404);
  }

  if (response.status === 429) {
    return new ApiError(i18n.t('errors.tooManyRequests'), 429);
  }

  return new ApiError(
    serverMessage(body) ?? (response.status >= 500 ? i18n.t('errors.server') : i18n.t('errors.unexpected')),
    response.status,
  );
}

async function request<T>(
  path: string,
  method: string,
  body: unknown,
  options: RequestOptions = {},
): Promise<T> {
  if (!API_BASE_URL) {
    throw new ApiError(i18n.t('errors.unexpected'), undefined, new Error('EXPO_PUBLIC_API_BASE_URL is not configured'));
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Accept-Language': acceptLanguage(),
  };

  let token: string | null = null;
  if (!options.skipAuth) {
    token = await tokenGetter();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    // Let fetch set the multipart boundary.
    payload = body;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: payload,
      signal: options.signal,
    });
  } catch (error) {
    if (options.signal?.aborted) {
      throw error;
    }

    throw new ApiError(i18n.t('errors.apiOffline'), undefined, error);
  }

  const parsed = await readJson(response);

  if (!response.ok) {
    if (response.status === 401 && token) {
      unauthorizedHandler?.();
    }

    throw toApiError(response, parsed);
  }

  return parsed as T;
}

export const apiClient = {
  get<T>(path: string, signal?: AbortSignal, options: Omit<RequestOptions, 'signal'> = {}): Promise<T> {
    return request<T>(path, 'GET', undefined, { ...options, signal });
  },
  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>(path, 'POST', body ?? {}, options);
  },
  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>(path, 'PATCH', body ?? {}, options);
  },
  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>(path, 'PUT', body ?? {}, options);
  },
  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>(path, 'DELETE', undefined, options);
  },
  /** Multipart upload; `body` must be a FormData instance. */
  postForm<T>(path: string, body: FormData, options?: RequestOptions): Promise<T> {
    return request<T>(path, 'POST', body, options);
  },
};

/**
 * Builds an absolute URL for API-served assets (e.g. avatars). The API already returns absolute
 * URLs, but the host may be `localhost` from the server's point of view, so rebase onto the
 * configured API base URL when needed.
 */
export function resolveApiUrl(url: string | null | undefined): string | null {
  if (!url) {
    return null;
  }

  if (!API_BASE_URL) {
    return url;
  }

  if (url.startsWith('/')) {
    return `${API_BASE_URL}${url}`;
  }

  try {
    const parsed = new URL(url);
    return `${API_BASE_URL}${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
}

