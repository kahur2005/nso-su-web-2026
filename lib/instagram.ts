// lib/instagram.ts
//
// Single source of truth for turning whatever an admin types into an
// Instagram field (a bare handle, "@handle", "instagram.com/handle", or a
// full URL) into a canonical https://instagram.com/<handle> URL. Both NPC
// writers (app/api/qr/generate/route.ts and createCommitteeMember in
// app/admin/actions.ts) must run their `instagram` value through this before
// it is stored, so the DB never holds anything the public page's bare
// `href={member.instagram}` would mishandle.
//
// Pure module, no imports: it is reachable from client components (form
// placeholder/preview logic), so it must not pull in server-only code.

export function normalizeInstagram(input: string | null | undefined): string | null {
  if (!input) return null

  let value = input.trim()
  if (!value) return null

  // Strip a leading scheme + www so we can uniformly find "instagram.com/...".
  value = value.replace(/^https?:\/\//i, '').replace(/^www\./i, '')

  let handle: string
  if (/^instagram\.com\//i.test(value)) {
    handle = value.slice('instagram.com/'.length)
  } else {
    // Bare handle, optionally prefixed with "@".
    handle = value.replace(/^@/, '')
  }

  // Drop any trailing path/query/fragment/slash instagram.com URLs can carry.
  handle = handle.split(/[/?#]/)[0].trim()

  if (!handle) return null

  return `https://instagram.com/${handle}`
}
