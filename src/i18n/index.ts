import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import enAuth from '@/i18n/locales/en/auth.json'
import enCommon from '@/i18n/locales/en/common.json'
import enErrors from '@/i18n/locales/en/errors.json'
import enProfile from '@/i18n/locales/en/profile.json'
import csAuth from '@/i18n/locales/cs-CZ/auth.json'
import csCommon from '@/i18n/locales/cs-CZ/common.json'
import csErrors from '@/i18n/locales/cs-CZ/errors.json'
import csProfile from '@/i18n/locales/cs-CZ/profile.json'

const preferredLanguage = localStorage.getItem('preferredLanguage') || 'en'

void i18n.use(initReactI18next).init({
  lng: preferredLanguage === 'cs-CZ' ? 'cs-CZ' : 'en',
  fallbackLng: 'en',
  defaultNS: 'common',
  ns: ['auth', 'profile', 'common', 'errors'],
  interpolation: {
    escapeValue: false,
  },
  resources: {
    en: {
      auth: enAuth,
      profile: enProfile,
      common: enCommon,
      errors: enErrors,
    },
    'cs-CZ': {
      auth: csAuth,
      profile: csProfile,
      common: csCommon,
      errors: csErrors,
    },
  },
})

export default i18n
