// app/api/auth/reset-password/route.ts
//
// Step 2 of the reset flow.
//   GET  ?token=…            → is this link still good? (so the page can say
//                              "expired" before the user types a password)
//   POST { token, password } → claim the token and set the new password.
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { hashPassword } from '@/lib/password'
import { MIN_PASSWORD_LENGTH, hashResetToken } from '@/lib/password-reset'

const INVALID = 'This reset link is invalid or has expired. Please request a new one.'

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token') || ''
  if (!token) return NextResponse.json({ valid: false, error: INVALID }, { status: 400 })

  const { data, error } = await supabase
    .from('PasswordResetToken')
    .select('id')
    .eq('tokenHash', hashResetToken(token))
    .is('usedAt', null)
    .gt('expiresAt', new Date().toISOString())
    .maybeSingle()

  if (error) {
    console.error('[reset-password] Token lookup failed:', error)
    return NextResponse.json(
      { valid: false, error: 'Password reset is unavailable right now.' },
      { status: 500 }
    )
  }
  if (!data) return NextResponse.json({ valid: false, error: INVALID }, { status: 400 })

  return NextResponse.json({ valid: true })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const token = String(body?.token || '')
  const password = String(body?.password || '')

  if (!token) return NextResponse.json({ error: INVALID }, { status: 400 })
  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
      { status: 400 }
    )
  }

  const tokenHash = hashResetToken(token)
  const now = new Date().toISOString()

  // Claim the token FIRST, as one conditional UPDATE. Postgres serialises this,
  // so two racing clicks on the same link can't both come back with a row —
  // that is what makes the link genuinely single-use.
  const { data: claimed, error: claimError } = await supabase
    .from('PasswordResetToken')
    .update({ usedAt: now })
    .eq('tokenHash', tokenHash)
    .is('usedAt', null)
    .gt('expiresAt', now)
    .select('id, studentId')
    .maybeSingle()

  if (claimError) {
    console.error('[reset-password] Token claim failed:', claimError)
    return NextResponse.json(
      { error: 'Password reset is unavailable right now. Please contact a committee member.' },
      { status: 500 }
    )
  }
  if (!claimed) return NextResponse.json({ error: INVALID }, { status: 400 })

  const { error: pwError } = await supabase
    .from('Student')
    .update({ password: hashPassword(password) })
    .eq('id', claimed.studentId)

  if (pwError) {
    console.error('[reset-password] Password update failed:', pwError)
    // Release the claim so the user's link isn't burned by our own failure.
    const { error: rollbackError } = await supabase
      .from('PasswordResetToken')
      .update({ usedAt: null })
      .eq('id', claimed.id)
    if (rollbackError) {
      console.error('[reset-password] Claim rollback failed:', rollbackError)
    }
    return NextResponse.json(
      { error: 'Could not update your password. Please try again.' },
      { status: 500 }
    )
  }

  // Burn every other outstanding link for this student — an older reset email
  // still sitting in their inbox must not keep working.
  const { error: sweepError } = await supabase
    .from('PasswordResetToken')
    .update({ usedAt: now })
    .eq('studentId', claimed.studentId)
    .is('usedAt', null)
  if (sweepError) {
    // Not fatal: the password is already changed and the leftovers expire
    // within the hour. Worth knowing about, not worth failing the request.
    console.error('[reset-password] Failed to sweep outstanding tokens:', sweepError)
  }

  return NextResponse.json({ ok: true })
}
