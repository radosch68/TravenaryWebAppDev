import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuthStore } from '@/store/auth-store'

interface PublicOnlyRouteProps {
  children: ReactNode
}

export function PublicOnlyRoute({ children }: PublicOnlyRouteProps): ReactNode {
  const accessToken = useAuthStore((state) => state.accessToken)

  if (accessToken) {
    return <Navigate replace to="/" />
  }

  return children
}
