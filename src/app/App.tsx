import type { ReactElement } from 'react'
import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useSearchParams } from 'react-router-dom'

import { CollisionGuardRoute } from './guards/CollisionGuardRoute'
import { ProtectedRoute } from './guards/ProtectedRoute'
import { PublicOnlyRoute } from './guards/PublicOnlyRoute'
import { ItineraryDetailPage } from '@/pages/ItineraryDetailPage'
import { ItineraryMapPage } from '@/pages/ItineraryMapPage'
import { DayDetailPage } from '@/pages/DayDetailPage'
import { SharedItineraryPage } from '@/pages/SharedItineraryPage'
import { HomePage } from '../pages/HomePage'
import { GithubOAuthCallbackPage } from '../pages/GithubOAuthCallbackPage'
import { LinkProviderPage } from '../pages/LinkProviderPage'
import { ProfilePage } from '../pages/ProfilePage'
import { SignInPage } from '../pages/SignInPage'
import { SignUpPage } from '../pages/SignUpPage'
import { useAuthStore } from '../store/auth-store'

function HomeRoute(): ReactElement {
  const [searchParams] = useSearchParams()
  const mapItineraryId = searchParams.get('mapItineraryId')?.trim()
  const mapDayNumber = searchParams.get('mapDayNumber')?.trim()

  if (mapItineraryId) {
    return <ItineraryMapPage itineraryIdOverride={mapItineraryId} dayNumberOverride={mapDayNumber} />
  }

  return <HomePage />
}

export default function App(): ReactElement {
  const restoreSessionFromStorage = useAuthStore(
    (state) => state.restoreSessionFromStorage,
  )

  useEffect(() => {
    void restoreSessionFromStorage()
  }, [restoreSessionFromStorage])

  useEffect(() => {
    const root = document.getElementById('root')
    const searchParams = new URLSearchParams(window.location.search)
    const previewMode = searchParams.get('preview')
    const previewWidthParam = searchParams.get('previewWidth')

    let previewWidth: string | null = null

    if (previewMode === 'iphone') {
      previewWidth = '390px'
    } else if (previewMode === 'iphone-plus') {
      previewWidth = '430px'
    } else if (previewWidthParam && /^\d{3,4}$/.test(previewWidthParam)) {
      previewWidth = `${previewWidthParam}px`
    }

    if (previewWidth) {
      document.body.dataset.previewWidth = previewWidth
      root?.setAttribute('data-preview-width', previewWidth)
      root?.style.setProperty('--desktop-preview-width', previewWidth)
      return () => {
        delete document.body.dataset.previewWidth
        root?.removeAttribute('data-preview-width')
        root?.style.removeProperty('--desktop-preview-width')
      }
    }

    delete document.body.dataset.previewWidth
    root?.removeAttribute('data-preview-width')
    root?.style.removeProperty('--desktop-preview-width')
  }, [])

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route
          path="/signin"
          element={
            <PublicOnlyRoute>
              <SignInPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicOnlyRoute>
              <SignUpPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/link-provider"
          element={
            <PublicOnlyRoute>
              <CollisionGuardRoute>
                <LinkProviderPage />
              </CollisionGuardRoute>
            </PublicOnlyRoute>
          }
        />
        <Route path="/oauth/github/callback" element={<GithubOAuthCallbackPage />} />
        <Route path="/s/:shareToken" element={<SharedItineraryPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomeRoute />
            </ProtectedRoute>
          }
        />
        <Route
          path="/itineraries/:itineraryId"
          element={
            <ProtectedRoute>
              <ItineraryDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/itineraries/:itineraryId/map"
          element={
            <ProtectedRoute>
              <ItineraryMapPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/itineraries/:itineraryId/days/:dayNumber"
          element={
            <ProtectedRoute>
              <DayDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
