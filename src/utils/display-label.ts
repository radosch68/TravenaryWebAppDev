export const DISPLAY_TEXT_MAX_CHARS = 24

export function toDisplayLabel(value: string, maxChars = DISPLAY_TEXT_MAX_CHARS): string {
  const normalized = value.trim().replace(/\s+/g, ' ')
  const chars = Array.from(normalized)

  if (chars.length <= maxChars) {
    return normalized
  }

  return `${chars.slice(0, maxChars).join('')}…`
}
