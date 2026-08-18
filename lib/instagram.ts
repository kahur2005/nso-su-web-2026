/** Normalize Instagram handle or URL to canonical https://instagram.com/<handle> format. */
export function normalizeInstagram(input: string | null | undefined): string | null {
  if (!input) return null

  let value = input.trim()
  if (!value) return null

  value = value.replace(/^https?:\/\//i, '').replace(/^www\./i, '')

  let handle: string
  if (/^instagram\.com\//i.test(value)) {
    handle = value.slice('instagram.com/'.length)
  } else {
    handle = value.replace(/^@/, '')
  }

  handle = handle.split(/[/?#]/)[0].trim()
  if (!handle) return null

  return `https://instagram.com/${handle}`
}
