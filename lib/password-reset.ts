// lib/password-reset.ts
//
// SERVER-ONLY (uses node:crypto). Token minting/hashing and the reset-email
// body for the "Forgot password?" flow.
//
// Split of responsibilities:
//   lib/password-reset.ts  — what a token is, and what the email says (pure)
//   lib/mailer.ts          — how mail leaves the building (transport)
//   app/api/auth/*         — the flow, the DB, and the guards
import { createHash, randomBytes, timingSafeEqual } from 'crypto'

/** How long a reset link stays valid. */
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour

/**
 * Minimum gap between reset emails for the same account. Gmail SMTP is capped
 * at ~500 sends/day, so an unthrottled endpoint is an availability risk, not
 * just a nuisance.
 */
export const RESET_REQUEST_COOLDOWN_MS = 60 * 1000 // 60 seconds

/** Matches the register route's rule so the two can't drift apart. */
export const MIN_PASSWORD_LENGTH = 6

/**
 * A fresh reset token. The raw value goes in the email and nowhere else; only
 * `hash` is ever persisted, so a leaked DB snapshot yields no usable links.
 */
export function createResetToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString('base64url')
  return { raw, hash: hashResetToken(raw) }
}

/**
 * SHA-256, not scrypt. Unlike a password, this token is 32 bytes of CSPRNG
 * output — there is no low-entropy space to brute force, so a slow KDF would
 * buy nothing and cost a lookup on every click.
 */
export function hashResetToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}

/** Constant-time compare for two hex digests of equal length. */
export function safeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'hex')
  const bufB = Buffer.from(b, 'hex')
  if (bufA.length !== bufB.length || bufA.length === 0) return false
  return timingSafeEqual(bufA, bufB)
}

export function resetLink(rawToken: string): string {
  const base = (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '')
  return `${base}/reset-password?token=${encodeURIComponent(rawToken)}`
}

/** Plain-text + HTML bodies for the reset email. */
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

  // Inline styles only: mail clients strip <style> blocks and never load
  // external CSS. Keep this simple and table-free; it renders fine everywhere.
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
