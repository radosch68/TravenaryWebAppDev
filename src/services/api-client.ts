import { ApiError, type ApiRequestOptions, type AuthTokens, type ErrorResponse } from '@/services/contracts'

interface ApiAuthHandlers {
  getAccessToken: () => string | null
  getRefreshToken: () => string | null
  onRefreshSuccess: (tokens: AuthTokens) => void
  onRefreshFailure: () => void
}

const DEFAULT_TIMEOUT_MS = 15_000

let authHandlers: ApiAuthHandlers | undefined
let refreshInFlight: Promise<AuthTokens> | null = null

function baseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
}

function normalizeApiError(status: number, payload: unknown): ApiError {
  if (payload && typeof payload === 'object') {
    const typed = payload as Partial<ErrorResponse>
    return new ApiError(status, typed)
  }

  return new ApiError(status, {
    code: status >= 500 ? 'INTERNAL_ERROR' : 'UNKNOWN_ERROR',
    message: 'Request failed',
  })
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    return undefined
  }

  return response.json()
}

export function configureApiClientAuthHandlers(handlers: ApiAuthHandlers): void {
  authHandlers = handlers
}

export async function refreshSessionTokens(): Promise<AuthTokens> {
  if (!authHandlers) {
    throw new Error('API auth handlers are not configured')
  }

  if (refreshInFlight) {
    return refreshInFlight
  }

  const refreshToken = authHandlers.getRefreshToken()
  if (!refreshToken) {
    authHandlers.onRefreshFailure()
    throw new ApiError(401, {
      code: 'UNAUTHORIZED',
      message: 'Session expired',
    })
  }

  refreshInFlight = (async () => {
    const response = await fetch(`${baseUrl()}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) {
      const errorPayload = await parseResponseBody(response)
      authHandlers?.onRefreshFailure()
      throw normalizeApiError(response.status, errorPayload)
    }

    const payload = (await parseResponseBody(response)) as AuthTokens
    authHandlers?.onRefreshSuccess(payload)
    return payload
  })()

  try {
    return await refreshInFlight
  } finally {
    refreshInFlight = null
  }
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    method = 'GET',
    body,
    protected: needsAuth = false,
    isRetrying = false,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    skipAuthRefreshOn401 = false,
  } = options

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (needsAuth) {
      const token = authHandlers?.getAccessToken()
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }
    }

    const response = await fetch(`${baseUrl()}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })

    if (response.status === 204) {
      return undefined as T
    }

    const payload = await parseResponseBody(response)

    if (response.ok) {
      return payload as T
    }

    const shouldTryRefresh =
      needsAuth && response.status === 401 && !isRetrying && !skipAuthRefreshOn401

    if (shouldTryRefresh) {
      try {
        await refreshSessionTokens()
        return await apiRequest<T>(path, {
          ...options,
          isRetrying: true,
        })
      } catch {
        authHandlers?.onRefreshFailure()
        throw new ApiError(401, {
          code: 'UNAUTHORIZED',
          message: 'Session expired',
        })
      }
    }

    throw normalizeApiError(response.status, payload)
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(408, {
        code: 'NETWORK_TIMEOUT',
        message: 'Request timed out',
      })
    }

    throw new ApiError(500, {
      code: 'NETWORK_ERROR',
      message: 'Unable to reach server',
    })
  } finally {
    clearTimeout(timeout)
  }
}
