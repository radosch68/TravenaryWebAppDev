import type { ReactElement } from 'react'
import { useEffect } from 'react'

export function GithubOAuthCallbackPage(): ReactElement {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    window.opener?.postMessage(
      {
        source: 'travenary:github-oauth',
        code: params.get('code') ?? undefined,
        state: params.get('state') ?? undefined,
        error: params.get('error') ?? undefined,
      },
      window.location.origin,
    )

    window.close()
  }, [])

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p>Completing GitHub sign-in...</p>
      </section>
    </main>
  )
}
