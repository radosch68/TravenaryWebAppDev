import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuthStore } from '@/store/auth-store'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps): ReactNode {
  const accessToken = useAuthStore((state) => state.accessToken)
  const restorationChecked = useAuthStore((state) => state.restorationChecked)

  if (!restorationChecked) {
    return <p>Loading...</p>
  }

  if (!accessToken) {
    return <Navigate replace to="/signin" />
  }

  return children
}
