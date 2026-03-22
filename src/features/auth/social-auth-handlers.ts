import type { NavigateFunction } from 'react-router-dom'

import { ApiError } from '@/services/contracts'
import { socialSignIn } from '@/services/auth-service'
import { useAuthStore } from '@/store/auth-store'

export async function handleSocialAuth(
  provider: 'google' | 'apple',
  getToken: () => Promise<string>,
  navigate: NavigateFunction,
  setErrorMessage: (value: string) => void,
): Promise<void> {
  let idToken: string | null = null

  try {
    idToken = await getToken()
    const tokens = await socialSignIn(provider, idToken)
    await useAuthStore.getState().bootstrapAuthenticatedSession(tokens)
    navigate('/')
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      if (!idToken) {
        setErrorMessage('errors.providerUnavailable')
        return
      }

      useAuthStore.getState().setIdentityCollision({
        provider,
        idToken,
        linkStatus: 'collision_blocked',
      })
      navigate('/link-provider')
      return
    }

    if (error instanceof ApiError && error.status === 401) {
      setErrorMessage('auth:errors.invalidCredentials')
      return
    }

    setErrorMessage('errors.providerUnavailable')
  }
}
