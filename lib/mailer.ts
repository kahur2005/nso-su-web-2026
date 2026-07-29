// lib/mailer.ts
//
// SERVER-ONLY. Outbound email over Gmail SMTP via nodemailer.
//
// Gmail specifics that shaped this file:
//   * MAIL_PASSWORD must be a Google **App Password** (16 chars, generated at
//     myaccount.google.com/apppasswords with 2FA on), not the account password.
//     Google has blocked plain-password SMTP since 2022.
//   * Port 465 + secure:true, not 587/STARTTLS. Serverless functions are
//     short-lived and 465 negotiates TLS immediately, which is one fewer
//     round-trip to lose to a cold start.
//   * Gmail caps a free account at ~500 recipients/day. That cap is the reason
//     /api/auth/forgot-password throttles per student — see the migration
//     comment in supabase/migrations/20260729_password_reset_tokens.sql.
//
// The transporter is created lazily and cached on the module. Creating it at
// import time would throw during `next build`, when env vars are absent.
import { lookup } from 'dns/promises'
import nodemailer, { type Transporter } from 'nodemailer'

let cached: Transporter | null = null

export class MailerNotConfiguredError extends Error {
  constructor(missing: string[]) {
    super(`Mailer is not configured. Missing env var(s): ${missing.join(', ')}`)
    this.name = 'MailerNotConfiguredError'
  }
}

async function getTransporter(): Promise<Transporter> {
  if (cached) return cached

  const user = process.env.MAIL_USER
  // App Passwords are displayed as "abcd efgh ijkl mnop"; accept a pasted copy
  // with the spaces still in it rather than failing with an opaque 535.
  const pass = process.env.MAIL_PASSWORD?.replace(/\s/g, '')
  const missing: string[] = []
  if (!user) missing.push('MAIL_USER')
  if (!pass) missing.push('MAIL_PASSWORD')
  if (missing.length) throw new MailerNotConfiguredError(missing)

  const host = process.env.MAIL_HOST || 'smtp.gmail.com'

  // Resolve the SMTP host ourselves, via the OS resolver.
  //
  // nodemailer resolves with dns.resolve4 (a direct UDP:53 query) and, on
  // *error*, gives up — see resolveHostname in nodemailer/lib/shared/index.js:
  // it only falls back to dns.lookup when a query succeeds with zero answers,
  // never on a timeout. Networks that block outbound UDP:53 (corporate LANs,
  // many VPNs) therefore fail every send with an opaque EDNS.
  //
  // dns.lookup goes through the OS resolver instead, so it honours the system's
  // configured DNS, DoH and /etc/hosts. We hand nodemailer the resulting IP and
  // set tls.servername so certificate validation still happens against the real
  // hostname — this is a DNS workaround, not a weakening of TLS.
  let connectHost = host
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    try {
      connectHost = (await lookup(host, { family: 4 })).address
    } catch {
      // Fall back to the hostname and let nodemailer try; a clear SMTP error
      // beats failing here on a resolver hiccup.
      connectHost = host
    }
  }

  cached = nodemailer.createTransport({
    host: connectHost,
    port: Number(process.env.MAIL_PORT || 465),
    secure: true,
    auth: { user, pass },
    tls: { servername: host },
  })
  return cached
}

export async function sendMail(opts: {
  to: string
  subject: string
  html: string
  text: string
}): Promise<void> {
  const transporter = await getTransporter()
  const from = process.env.MAIL_FROM || `NSO 2026 <${process.env.MAIL_USER}>`
  await transporter.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  })
}
