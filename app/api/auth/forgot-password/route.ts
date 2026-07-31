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
} from '@/lib/password-reset'

/**
 * Identical for "we sent it", "no such account", and "you just asked 10s ago".
 * Any variation here — including a different response time — leaks membership.
 */
const GENERIC = { ok: true, message: 'If that email has an account, a reset link is on its way.' }

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const email = String(body?.email || '').toLowerCase().trim()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email.' }, { status: 400 })
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
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }

  // Unknown email: stop here, but answer exactly as if we had sent one.
  if (!student) return NextResponse.json(GENERIC)

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
    return NextResponse.json(
      { error: 'Password reset is unavailable right now. Please contact a committee member.' },
      { status: 500 }
    )
  }
  if (recent && recent.length > 0) return NextResponse.json(GENERIC)

  const { raw, hash } = createResetToken()
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString()

  const { error: insertError } = await supabase.from('PasswordResetToken').insert({
    studentId: student.id,
    tokenHash: hash,
    expiresAt,
  })
  if (insertError) {
    console.error('[forgot-password] Token insert failed:', insertError)
    return NextResponse.json(
      { error: 'Password reset is unavailable right now. Please contact a committee member.' },
      { status: 500 }
    )
  }

  const { subject, text, html } = buildResetEmail({
    name: student.name || '',
    link: resetLink(raw),
  })

  try {
    await sendMail({ to: student.email, subject, text, html })
  } catch (err) {
    // The token row now exists but no email carries it — harmless (it expires
    // unused), and the user can retry after the cooldown. Report the failure
    // rather than claiming success we can't back up.
    console.error('[forgot-password] Send failed:', err)
    return NextResponse.json(
      { error: "We couldn't send the email right now. Please try again in a minute." },
      { status: 502 }
    )
  }

  return NextResponse.json(GENERIC)
}
