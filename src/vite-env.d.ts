/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_ENABLE_SOCIAL_AUTH?: 'true' | 'false'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  google?: {
    accounts: {
      id: {
        initialize: (config: {
          client_id: string
          callback: (response: { credential?: string }) => void
        }) => void
        prompt: () => void
      }
    }
  }
  AppleID?: {
    auth: {
      signIn: () => Promise<{ authorization?: { id_token?: string } }>
    }
  }
}
