'use client'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import AuthShell, {
  authButtonClass,
  authButtonShadow,
  authInputClass,
  authLabelClass,
  authLabelShadow,
} from '@/components/auth/AuthShell'

// useSearchParams() opts the subtree into client-side rendering, so it needs a
// Suspense boundary above it or the build fails on this route.
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthShell title="Loading..." >{null}</AuthShell>}>
      <ResetPasswordForm />
    </Suspense>
  )
}

function ResetPasswordForm() {
  const router = useRouter()
  const token = useSearchParams().get('token') || ''

  // Validity is checked up front so an expired link says so immediately,
  // instead of after the user has typed a password twice.
  const [checking, setChecking] = useState(true)
  const [linkError, setLinkError] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!token) {
      setLinkError('This reset link is missing its token. Please request a new one.')
      setChecking(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(
          `/api/auth/reset-password?token=${encodeURIComponent(token)}`
        )
        const data = await res.json().catch(() => ({}))
        if (cancelled) return
        if (!res.ok || !data.valid) {
          setLinkError(data.error || 'This reset link is invalid or has expired.')
        }
      } catch {
        if (!cancelled) setLinkError('Could not reach the server. Check your connection.')
      } finally {
        if (!cancelled) setChecking(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setError("Those passwords don't match.")
      return
    }
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        return
      }
      setDone(true)
      // Give the confirmation a beat to land before bouncing to login.
      setTimeout(() => router.push('/login'), 2500)
    } catch {
      setError('Could not reach the server. Check your connection.')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <AuthShell title="One sec...">
        <p
          className="text-center font-bytebounce text-[22px] text-[#e0b391] blink"
          style={authLabelShadow}
        >
          Checking your link
        </p>
      </AuthShell>
    )
  }

  if (linkError) {
    return (
      <AuthShell title="Link expired">
        <p
          className="text-center font-bytebounce text-[20px] leading-snug text-[#e0b391]"
          style={authLabelShadow}
        >
          {linkError}
        </p>
        <Link
          href="/forgot-password"
          className={`${authButtonClass} text-center leading-[52px]`}
          style={authButtonShadow}
        >
          Request a new link
        </Link>
      </AuthShell>
    )
  }

  if (done) {
    return (
      <AuthShell title="All set!">
        <p
          className="text-center font-bytebounce text-[22px] leading-snug text-[#7aff06]"
          style={authLabelShadow}
        >
          Your password has been changed. Taking you to the login screen...
        </p>
        <Link
          href="/login"
          className={`${authButtonClass} text-center leading-[52px]`}
          style={authButtonShadow}
        >
          Go to login
        </Link>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="New password" subtitle="Pick something you'll remember.">
      <form onSubmit={handleSubmit}>
        <label htmlFor="password" className={authLabelClass} style={authLabelShadow}>
          New password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
          placeholder="At least 6 characters"
          className={authInputClass}
        />

        <label
          htmlFor="confirm"
          className={`mt-6 ${authLabelClass}`}
          style={authLabelShadow}
        >
          Confirm password
        </label>
        <input
          id="confirm"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
          placeholder="Type it again"
          className={authInputClass}
        />

        {error && (
          <p
            className="mt-3 text-center font-bytebounce text-[18px] text-[#d6101d]"
            style={{ textShadow: '1.2px 0.7px 0 #e0b391' }}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className={authButtonClass}
          style={authButtonShadow}
        >
          {loading ? <span className="blink">Saving...</span> : 'Save new password'}
        </button>
      </form>
    </AuthShell>
  )
}
