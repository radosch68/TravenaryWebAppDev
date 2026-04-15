import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/app/App'
import { installGlobalFrontendLogging } from '@/services/frontend-logger'
import '@/i18n'
import '@/styles/globals.css'

installGlobalFrontendLogging()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
