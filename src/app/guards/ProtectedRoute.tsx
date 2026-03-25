import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { useAuthStore } from '@/store/auth-store'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps): ReactNode {
  const { t } = useTranslation()
  const accessToken = useAuthStore((state) => state.accessToken)
  const restorationChecked = useAuthStore((state) => state.restorationChecked)

  if (!restorationChecked) {
    return <p role="status" aria-live="polite">{t('common:loading')}</p>
  }

  if (!accessToken) {
    return <Navigate replace to="/signin" />
  }

  return children
}
