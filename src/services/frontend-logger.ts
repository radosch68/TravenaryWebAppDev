import { apiBaseUrl, getCurrentAccessToken } from '@/services/api-client'
import type { ClientLogLevel, ClientLogRequest } from '@/services/contracts'

const originalConsole = {
  debug: console.debug.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
}

let installed = false
let sendingInFlight = false

function shouldForward(level: ClientLogLevel): boolean {
  return level === 'error' || (level === 'warn' && import.meta.env.DEV)
}

function normalizeToMessage(value: unknown): string {
  if (value instanceof Error) {
    return value.message || value.name || 'Error'
  }

  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'number' || typeof value === 'boolean' || value === null || value === undefined) {
    return String(value)
  }

  try {
    return JSON.stringify(value)
  } catch {
    return Object.prototype.toString.call(value)
  }
}

function serializeArgs(args: unknown[]): { message: string; details?: string; stack?: string } {
  const firstError = args.find((arg): arg is Error => arg instanceof Error)
  const message = normalizeToMessage(args[0] ?? firstError ?? 'Frontend log event')
  const details = args.length > 1 ? args.slice(1).map((arg) => normalizeToMessage(arg)).join(' | ') : undefined

  return {
    message,
    details,
    stack: firstError?.stack,
  }
}

function sendToBackend(payload: ClientLogRequest): void {
  if (!shouldForward(payload.level) || sendingInFlight) {
    return
  }

  const accessToken = getCurrentAccessToken()
  if (!accessToken) {
    return
  }

  sendingInFlight = true
  const body = JSON.stringify(payload)
  const url = `${apiBaseUrl()}/logs/client`

  const reset = (): void => {
    sendingInFlight = false
  }

  try {
    void fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body,
      keepalive: true,
    }).finally(reset)
  } catch {
    reset()
  }
}

function forwardConsole(level: ClientLogLevel, args: unknown[]): void {
  const payloadBase = serializeArgs(args)

  sendToBackend({
    level,
    kind: 'console',
    message: payloadBase.message,
    details: payloadBase.details,
    stack: payloadBase.stack,
    url: window.location.href,
  })
}

function installConsoleForwarders(): void {
  console.warn = (...args: unknown[]): void => {
    originalConsole.warn(...args)
    forwardConsole('warn', args)
  }

  console.error = (...args: unknown[]): void => {
    originalConsole.error(...args)
    forwardConsole('error', args)
  }
}

function installGlobalHandlers(): void {
  window.addEventListener('error', (event) => {
    sendToBackend({
      level: 'error',
      kind: 'window-error',
      message: event.message || 'Unhandled window error',
      stack: event.error instanceof Error ? event.error.stack : undefined,
      url: window.location.href,
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason

    sendToBackend({
      level: 'error',
      kind: 'unhandledrejection',
      message: normalizeToMessage(reason ?? 'Unhandled promise rejection'),
      stack: reason instanceof Error ? reason.stack : undefined,
      url: window.location.href,
    })
  })
}

export function installGlobalFrontendLogging(): void {
  if (installed || typeof window === 'undefined') {
    return
  }

  installed = true
  installConsoleForwarders()
  installGlobalHandlers()
}

export const frontendLogger = {
  debug: (...args: unknown[]): void => originalConsole.debug(...args),
  info: (...args: unknown[]): void => originalConsole.info(...args),
  warn: (...args: unknown[]): void => console.warn(...args),
  error: (...args: unknown[]): void => console.error(...args),
}
