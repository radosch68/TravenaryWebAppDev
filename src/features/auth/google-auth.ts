const SDK_POLL_INTERVAL_MS = 200
const SDK_LOAD_TIMEOUT_MS = 5_000

export function renderGoogleSignInButton(
  element: HTMLElement,
  onCredential: (credential: string) => void,
  onUnavailable: () => void,
): () => void {
  const clientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID
  if (!clientId) {
    throw new Error('provider_unavailable')
  }

  let disposed = false

  type GoogleAccountsId = NonNullable<typeof window.google>['accounts']['id']

  const doRender = (width: number, googleAccountsId: GoogleAccountsId): void => {
    googleAccountsId.initialize({
      client_id: clientId,
      callback: (response) => {
        if (!response.credential) {
          onUnavailable()
          return
        }

        onCredential(response.credential)
      },
    })

    element.innerHTML = ''
    googleAccountsId.renderButton(element, {
      theme: 'outline',
      size: 'large',
      shape: 'pill',
      text: 'continue_with',
      width,
    })
  }

  // Re-render whenever the container changes size so the button fills the full
  // width. This fixes Safari, where clientWidth may be 0 on the first
  // synchronous pass before the browser has completed layout.
  const observer = new ResizeObserver((entries) => {
    if (disposed) return
    const w = Math.round(entries[0]?.contentRect.width ?? 0)
    const googleAccountsId = window.google?.accounts?.id
    if (w > 0 && googleAccountsId?.renderButton) {
      doRender(w, googleAccountsId)
    }
  })
  observer.observe(element)

  const render = (): boolean => {
    const googleAccountsId = window.google?.accounts?.id
    if (disposed || !googleAccountsId?.renderButton) {
      return false
    }
    const width = element.clientWidth
    if (width > 0) {
      doRender(width, googleAccountsId)
    }
    // Return true even when width is 0 – SDK is ready; the ResizeObserver will
    // fire once the element is laid out and call doRender with the real width.
    return true
  }

  if (render()) {
    return () => {
      disposed = true
      observer.disconnect()
    }
  }

  const intervalId = window.setInterval(() => {
    if (render()) {
      window.clearInterval(intervalId)
      window.clearTimeout(timeoutId)
    }
  }, SDK_POLL_INTERVAL_MS)

  const timeoutId = window.setTimeout(() => {
    window.clearInterval(intervalId)
    if (!disposed) {
      onUnavailable()
    }
  }, SDK_LOAD_TIMEOUT_MS)

  return () => {
    disposed = true
    observer.disconnect()
    window.clearInterval(intervalId)
    window.clearTimeout(timeoutId)
  }
}
