'use client'
import { useState } from 'react'
import AuthShell, {
  authButtonClass,
  authButtonShadow,
  authInputClass,
  authLabelClass,
  authLabelShadow,
} from '@/components/auth/AuthShell'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  // Temporary debug readout for the localhost reset-link investigation.
  const [debugResetBase, setDebugResetBase] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        return
      }
      // Success is deliberately vague — the API never reveals whether this
      // email has an account, and the UI must not either.
      if (typeof data._debugResetBase === 'string') {
        setDebugResetBase(data._debugResetBase)
      }
      setSent(true)
    } catch {
      setError('Could not reach the server. Check your connection.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <AuthShell title="Check your email">
        <p
          className="text-center font-bytebounce text-[22px] leading-snug text-[#e0b391]"
          style={authLabelShadow}
        >
          If <span className="text-[#fbc94c]">{email}</span> has an account, we&apos;ve
          sent a link to reset your password.
        </p>
        <p
          className="mt-4 text-center font-bytebounce text-[18px] leading-snug text-[#e0b391]"
          style={authLabelShadow}
        >
          The link works once and expires in 1 hour. Check your spam folder if
          it doesn&apos;t show up.
        </p>
        {debugResetBase ? (
          <p
            className="mt-4 break-all text-center font-bytebounce text-[16px] leading-snug text-[#fbc94c]"
            style={authLabelShadow}
            data-debug="reset-base"
          >
            Debug link host: {debugResetBase}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => {
            setSent(false)
            setError('')
          }}
          className={authButtonClass}
          style={authButtonShadow}
        >
          Try another email
        </button>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Forgot password?"
      subtitle="Enter your email and we'll send you a link to set a new one."
    >
      <form onSubmit={handleSubmit}>
        <label htmlFor="email" className={authLabelClass} style={authLabelShadow}>
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="you@email.com"
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
          {loading ? <span className="blink">Sending...</span> : 'Send reset link'}
        </button>
      </form>
    </AuthShell>
  )
}
