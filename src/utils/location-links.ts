export function toGoogleMapsUrl(params: { coordinates?: [number, number]; address?: string }): string | null {
  if (params.coordinates) {
    const [longitude, latitude] = params.coordinates
    return `https://www.google.com/maps?q=${latitude},${longitude}`
  }

  const address = params.address?.trim()
  if (address) {
    return `https://www.google.com/maps/search/${encodeURIComponent(address)}`
  }

  return null
}

