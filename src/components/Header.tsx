import type { ReactElement } from 'react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { signOut } from '@/services/auth-service'
import { useAuthStore } from '@/store/auth-store'
import { useProfileStore } from '@/store/profile-store'

export function Header(): ReactElement {
  const navigate = useNavigate()
  const { t } = useTranslation(['auth', 'common'])
  const clearSession = useAuthStore((state) => state.clearSession)
  const profile = useProfileStore((state) => state.profile)
  const [isBusy, setIsBusy] = useState(false)

  const displayLabel = useMemo(() => {
    if (!profile) {
      return ''
    }

    return profile.displayName || profile.email
  }, [profile])

  const handleSignOut = async (): Promise<void> => {
    setIsBusy(true)
    try {
      await signOut()
    } finally {
      clearSession()
      setIsBusy(false)
      navigate('/signin')
    }
  }

  return (
    <header className="topbar">
      <div className="topbar__brand">Travenary</div>
      <nav className="topbar__nav">
        <Link to="/">{t('common:back')}</Link>
        <Link to="/profile">{t('profile:title')}</Link>
      </nav>
      <div className="topbar__actions">
        <span>{displayLabel}</span>
        <button onClick={() => void handleSignOut()} type="button" disabled={isBusy}>
          {isBusy ? t('common:loading') : t('auth:signOut')}
        </button>
      </div>
    </header>
  )
}
