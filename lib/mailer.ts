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
  const pass = process.env.MAIL_PASSWORD?.replace(/\s/g, '')
  const missing: string[] = []
  if (!user) missing.push('MAIL_USER')
  if (!pass) missing.push('MAIL_PASSWORD')
  if (missing.length) throw new MailerNotConfiguredError(missing)

  const host = process.env.MAIL_HOST || 'smtp.gmail.com'

  // Resolve host IP via OS resolver.
  let connectHost = host
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    try {
      connectHost = (await lookup(host, { family: 4 })).address
    } catch {
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
