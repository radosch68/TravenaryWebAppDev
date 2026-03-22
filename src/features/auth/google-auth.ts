export async function acquireGoogleIdToken(): Promise<string> {
  if (!window.google?.accounts?.id) {
    throw new Error('provider_unavailable')
  }

  return new Promise((resolve, reject) => {
    window.google?.accounts.id.initialize({
      client_id: '',
      callback: (response) => {
        if (response.credential) {
          resolve(response.credential)
          return
        }

        reject(new Error('provider_unavailable'))
      },
    })
    window.google?.accounts.id.prompt()
  })
}
