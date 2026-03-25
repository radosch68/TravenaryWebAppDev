import type { ReactElement } from 'react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

export function GithubOAuthCallbackPage(): ReactElement {
  const { t } = useTranslation(['auth'])

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
        <p role="status" aria-live="polite">{t('auth:social.oauthCallback')}</p>
      </section>
    </main>
  )
}
