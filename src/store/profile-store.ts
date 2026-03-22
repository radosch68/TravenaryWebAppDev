import { create } from 'zustand'

import type { UserProfile } from '@/services/contracts'

interface ProfileState {
  profile: UserProfile | null
  preferredLanguage: 'en' | 'cs-CZ'
  setProfile: (profile: UserProfile | null) => void
  setPreferredLanguage: (value: 'en' | 'cs-CZ') => void
  clearProfile: () => void
}

const LANGUAGE_KEY = 'preferredLanguage'

function getInitialLanguage(): 'en' | 'cs-CZ' {
  const savedLanguage = localStorage.getItem(LANGUAGE_KEY)
  return savedLanguage === 'cs-CZ' ? 'cs-CZ' : 'en'
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  preferredLanguage: getInitialLanguage(),
  setProfile: (profile) => {
    set({ profile })
  },
  setPreferredLanguage: (preferredLanguage) => {
    localStorage.setItem(LANGUAGE_KEY, preferredLanguage)
    set({ preferredLanguage })
  },
  clearProfile: () => {
    set({ profile: null })
  },
}))
