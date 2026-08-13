// app/api/auth/forgot-password/route.ts
//
// Step 1 of the reset flow: take an email, mint a single-use token, email the
// link. Always answers with the same generic success body so the endpoint can't
// be used to enumerate which emails have accounts.
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

/**
 * Identical for "we sent it", "no such account", and "you just asked 10s ago".
 * Any variation here — including a different response time — leaks membership.
 */
const GENERIC = { ok: true, message: 'If that email has an account, a reset link is on its way.' }

/** Public site origin from the incoming request (works behind Vercel’s proxy). */
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
  body: unknown,
  request: Request,
  init?: { status?: number }
): NextResponse {
  const resolved = resolveResetBase([
    publicBaseFromRequest(request),
    process.env.NEXT_PUBLIC_BASE_URL,
    process.env.NEXTAUTH_URL,
    process.env.VERCEL_URL,
  ])
  const res = NextResponse.json(body, init)
  // Temporary probe header so we can confirm Production resolved the public host.
  res.headers.set('x-nso-reset-base', resolved)
  return res
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const email = String(body?.email || '').toLowerCase().trim()
  const requestBase = publicBaseFromRequest(request)

  // #region agent log
  const reqPayload = {sessionId:'06b2cb',runId:'post-fix',hypothesisId:'C-D-F',location:'app/api/auth/forgot-password/route.ts:POST',message:'forgot-password request origin',data:{requestUrl:request.url,host:request.headers.get('host'),origin:request.headers.get('origin'),xForwardedHost:request.headers.get('x-forwarded-host'),xForwardedProto:request.headers.get('x-forwarded-proto'),publicBase:requestBase,hasEmail:Boolean(email)},timestamp:Date.now()}
  fetch('http://127.0.0.1:7683/ingest/491e9167-62e2-4f60-bb4c-3c2656e9f6ec',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'06b2cb'},body:JSON.stringify(reqPayload)}).catch(()=>{});
  console.info('[nso-debug][06b2cb]', JSON.stringify(reqPayload))
  // #endregion

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonWithResetBase({ error: 'Please enter a valid email.' }, request, { status: 400 })
  }

  const { data: student, error: lookupError } = await supabase
    .from('Student')
    .select('id, name, email')
    .eq('email', email)
    .maybeSingle()

  // A broken lookup is our fault, not the user's — surface it rather than
  // pretending we sent an email that we never attempted.
  if (lookupError) {
    console.error('[forgot-password] Student lookup failed:', lookupError)
    return jsonWithResetBase(
      { error: 'Something went wrong. Please try again.' },
      request,
      { status: 500 }
    )
  }

  // Unknown email: stop here, but answer exactly as if we had sent one.
  if (!student) return jsonWithResetBase(GENERIC, request)

  // Throttle. An unused, unexpired token minted within the cooldown means we
  // already emailed this person very recently; sending again would just burn
  // the Gmail daily quota. Silently succeed.
  const cooldownStart = new Date(Date.now() - RESET_REQUEST_COOLDOWN_MS).toISOString()
  const { data: recent, error: recentError } = await supabase
    .from('PasswordResetToken')
    .select('id')
    .eq('studentId', student.id)
    .is('usedAt', null)
    .gt('createdAt', cooldownStart)
    .limit(1)

  // Do NOT swallow this. If PasswordResetToken is missing (the migration was
  // never run), failing loudly here is what stops this feature from silently
  // behaving like the SingleUseToken drift documented in CLAUDE.md.
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

  // #region agent log
  let linkOrigin: string | null = null
  try { linkOrigin = new URL(link).origin } catch { linkOrigin = 'invalid-url' }
  const sendPayload = {sessionId:'06b2cb',runId:'post-fix',hypothesisId:'B-E-H',location:'app/api/auth/forgot-password/route.ts:beforeSend',message:'email link origin before send',data:{linkOrigin,isLocalhost:/localhost|127\.0\.0\.1/i.test(linkOrigin||'')},timestamp:Date.now()}
  fetch('http://127.0.0.1:7683/ingest/491e9167-62e2-4f60-bb4c-3c2656e9f6ec',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'06b2cb'},body:JSON.stringify(sendPayload)}).catch(()=>{});
  console.info('[nso-debug][06b2cb]', JSON.stringify(sendPayload))
  // #endregion

  try {
    await sendMail({ to: student.email, subject, text, html })
  } catch (err) {
    // The token row now exists but no email carries it — harmless (it expires
    // unused), and the user can retry after the cooldown. Report the failure
    // rather than claiming success we can't back up.
    console.error('[forgot-password] Send failed:', err)
    return jsonWithResetBase(
      { error: "We couldn't send the email right now. Please try again in a minute." },
      request,
      { status: 502 }
    )
  }

  return jsonWithResetBase(GENERIC, request)
}
