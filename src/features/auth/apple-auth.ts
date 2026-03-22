export async function acquireAppleIdToken(): Promise<string> {
  if (!window.AppleID?.auth) {
    throw new Error('provider_unavailable')
  }

  const result = await window.AppleID.auth.signIn()
  const token = result.authorization?.id_token

  if (!token) {
    throw new Error('provider_unavailable')
  }

  return token
}
