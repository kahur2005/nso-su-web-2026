import { createHash, randomBytes, timingSafeEqual } from 'crypto'

/** Reset link validity period in milliseconds (1 hour). */
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000

/** Minimum time between password reset requests in milliseconds (60 seconds). */
export const RESET_REQUEST_COOLDOWN_MS = 60 * 1000

/** Minimum allowed password length. */
export const MIN_PASSWORD_LENGTH = 6

/** Generate a random token and its SHA-256 hash. */
export function createResetToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString('base64url')
  return { raw, hash: hashResetToken(raw) }
}

/** Compute SHA-256 hash of a reset token. */
export function hashResetToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}

/** Compare two hex strings in constant time. */
export function safeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'hex')
  const bufB = Buffer.from(b, 'hex')
  if (bufA.length !== bufB.length || bufA.length === 0) return false
  return timingSafeEqual(bufA, bufB)
}

function isLocalhostUrl(value: string): boolean {
  try {
    const { hostname } = new URL(value)
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
  } catch {
    return /localhost|127\.0\.0\.1/i.test(value)
  }
}

function normalizeBase(value: string | null | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim().replace(/\/+$/, '')
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

/** Resolve public site origin URL for reset links. */
export function resolveResetBase(candidates: Array<string | null | undefined>): string {
  const normalized = candidates.map(normalizeBase).filter((v): v is string => Boolean(v))
  const publicBase = normalized.find((v) => !isLocalhostUrl(v))
  if (publicBase) return publicBase
  if (process.env.VERCEL && process.env.VERCEL_URL) {
    return normalizeBase(process.env.VERCEL_URL) || 'http://localhost:3000'
  }
  return normalized[0] || 'http://localhost:3000'
}

/** Build absolute password reset URL. */
export function resetLink(rawToken: string, baseOverride?: string | null): string {
  const envBase = process.env.NEXT_PUBLIC_BASE_URL || null
  const nextAuthUrl = process.env.NEXTAUTH_URL || null
  const vercelUrl = process.env.VERCEL_URL || null
  const base = resolveResetBase([baseOverride, envBase, nextAuthUrl, vercelUrl])
  return `${base}/reset-password?token=${encodeURIComponent(rawToken)}`
}

/** Build plain-text and HTML email content for password reset. */
export function buildResetEmail(opts: { name: string; link: string }): {
  subject: string
  text: string
  html: string
} {
  const subject = 'Reset your NSO 2026 password'
  const greeting = opts.name ? `Hi ${opts.name},` : 'Hi,'

  const text = [
    greeting,
    '',
    'Someone asked to reset the password for your NSO 2026 account.',
    'Open the link below to choose a new one. It expires in 1 hour and can only be used once.',
    '',
    opts.link,
    '',
    "If this wasn't you, you can ignore this email — your password stays as it is.",
    '',
    '— NSO 2026',
  ].join('\n')

  const html = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f5efe6;padding:32px 16px;">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border:2px solid #e0b391;border-radius:14px;padding:28px;">
    <h1 style="margin:0 0 16px;font-size:22px;color:#4e342e;">Reset your password</h1>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.55;color:#4e342e;">${escapeHtml(greeting)}</p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.55;color:#4e342e;">
      Someone asked to reset the password for your NSO 2026 account.
      Tap the button below to choose a new one.
    </p>
    <p style="margin:0 0 20px;">
      <a href="${escapeHtml(opts.link)}"
         style="display:inline-block;background:#4e342e;color:#fbc94c;text-decoration:none;padding:13px 26px;border-radius:10px;font-size:16px;font-weight:600;">
        Choose a new password
      </a>
    </p>
    <p style="margin:0 0 20px;font-size:13px;line-height:1.55;color:#7a6a5d;">
      This link expires in <strong>1 hour</strong> and can only be used once.
      If the button doesn't work, copy this into your browser:<br>
      <span style="word-break:break-all;color:#4e342e;">${escapeHtml(opts.link)}</span>
    </p>
    <p style="margin:0;font-size:13px;line-height:1.55;color:#7a6a5d;">
      If this wasn't you, you can ignore this email — your password stays as it is.
    </p>
  </div>
</div>`.trim()

  return { subject, text, html }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
