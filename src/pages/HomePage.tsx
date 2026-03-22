import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'

import { Header } from '@/components/Header'
import { useProfileStore } from '@/store/profile-store'

export function HomePage(): ReactElement {
  const { t } = useTranslation(['common'])
  const profile = useProfileStore((state) => state.profile)

  return (
    <main className="app-shell">
      <Header />
      <section className="home-panel">
        <h1>{profile?.displayName || profile?.email}</h1>
        <p>{t('common:homePlaceholder')}</p>
        <button type="button">{t('common:createItinerary')}</button>
      </section>
    </main>
  )
}
