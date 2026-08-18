import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendMail } from '@/lib/mailer'
import {
  RESET_REQUEST_COOLDOWN_MS,
  RESET_TOKEN_TTL_MS,
  buildResetEmail,
  createResetToken,
  resetLink,
  resolveResetBase,
} from '@/lib/password-reset'

const GENERIC = { ok: true, message: 'If that email has an account, a reset link is on its way.' }

/** Extract public site origin from request headers. */
function publicBaseFromRequest(request: Request): string | null {
  const origin = request.headers.get('origin')?.trim() || null
  if (origin) return origin.replace(/\/+$/, '')

  const host =
    request.headers.get('x-forwarded-host')?.split(',')[0]?.trim() ||
    request.headers.get('host')?.trim() ||
    null
  if (!host) return null
  const proto =
    request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() ||
    (host.includes('localhost') || host.startsWith('127.') ? 'http' : 'https')
  return `${proto}://${host}`.replace(/\/+$/, '')
}

function jsonWithResetBase(
  body: Record<string, unknown>,
  request: Request,
  init?: { status?: number }
): NextResponse {
  const resolved = resolveResetBase([
    publicBaseFromRequest(request),
    process.env.NEXT_PUBLIC_BASE_URL,
    process.env.NEXTAUTH_URL,
    process.env.VERCEL_URL,
  ])
  const res = NextResponse.json({ ...body, _debugResetBase: resolved }, init)
  res.headers.set('x-nso-reset-base', resolved)
  return res
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const email = String(body?.email || '').toLowerCase().trim()
  const requestBase = publicBaseFromRequest(request)

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonWithResetBase({ error: 'Please enter a valid email.' }, request, { status: 400 })
  }

  const { data: student, error: lookupError } = await supabase
    .from('Student')
    .select('id, name, email')
    .eq('email', email)
    .maybeSingle()

  if (lookupError) {
    console.error('[forgot-password] Student lookup failed:', lookupError)
    return jsonWithResetBase(
      { error: 'Something went wrong. Please try again.' },
      request,
      { status: 500 }
    )
  }

  if (!student) return jsonWithResetBase(GENERIC, request)

  // Verify rate limit cooldown period.
  const cooldownStart = new Date(Date.now() - RESET_REQUEST_COOLDOWN_MS).toISOString()
  const { data: recent, error: recentError } = await supabase
    .from('PasswordResetToken')
    .select('id')
    .eq('studentId', student.id)
    .is('usedAt', null)
    .gt('createdAt', cooldownStart)
    .limit(1)

  if (recentError) {
    console.error('[forgot-password] Throttle check failed:', recentError)
    return jsonWithResetBase(
      { error: 'Password reset is unavailable right now. Please contact a committee member.' },
      request,
      { status: 500 }
    )
  }
  if (recent && recent.length > 0) return jsonWithResetBase(GENERIC, request)

  const { raw, hash } = createResetToken()
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString()

  const { error: insertError } = await supabase.from('PasswordResetToken').insert({
    studentId: student.id,
    tokenHash: hash,
    expiresAt,
  })
  if (insertError) {
    console.error('[forgot-password] Token insert failed:', insertError)
    return jsonWithResetBase(
      { error: 'Password reset is unavailable right now. Please contact a committee member.' },
      request,
      { status: 500 }
    )
  }

  const link = resetLink(raw, requestBase)
  const { subject, text, html } = buildResetEmail({
    name: student.name || '',
    link,
  })

  try {
    await sendMail({ to: student.email, subject, text, html })
  } catch (err) {
    console.error('[forgot-password] Send failed:', err)
    return jsonWithResetBase(
      { error: "We couldn't send the email right now. Please try again in a minute." },
      request,
      { status: 502 }
    )
  }

  return jsonWithResetBase(GENERIC, request)
}
