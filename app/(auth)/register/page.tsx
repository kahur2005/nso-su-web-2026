'use client'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import PixelCard from '@/components/ui/PixelCard'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    medicalNote: '',
    achievements: '',
    instagram: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const update = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        setError((data.error || 'REGISTRATION FAILED.').toUpperCase())
        setLoading(false)
        return
      }

      // Auto sign-in with the credentials we just registered.
      const signInRes = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      })

      if (signInRes?.error) {
        // Account exists but auto-login failed — send them to the login page.
        router.push('/login')
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('CONNECTION ERROR. TRY AGAIN.')
      setLoading(false)
    }
  }

  const inputClass = `w-full font-pixel text-xs text-white bg-gray-800
    border-4 border-black py-3 px-3
    focus:outline-none focus:border-blue-500
    placeholder:text-gray-600`

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden scanlines py-10"
      style={{
        background: 'linear-gradient(180deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)'
      }}
    >
      <div className="relative z-10 w-full max-w-md px-4">
        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="font-pixel text-2xl text-yellow-400"
            style={{ textShadow: '3px 3px 0 #b45309' }}>
            NSO 2026
          </h1>
          <p className="font-pixel text-xs text-gray-400 mt-2">
            CREATE YOUR CHARACTER
          </p>
        </div>

        <PixelCard className="bg-gray-900/90 border-white/20">
          <form onSubmit={handleRegister} className="p-6 space-y-5">
            <div className="text-5xl mb-2 float inline-block w-full text-center">🧙</div>

            {/* Name */}
            <div>
              <label className="font-pixel text-xs text-gray-300 block mb-2">
                YOUR NAME
              </label>
              <input
                type="text"
                value={form.name}
                onChange={update('name')}
                required
                autoComplete="name"
                placeholder="e.g. Alex Tan"
                className={inputClass}
              />
            </div>

            {/* Email */}
            <div>
              <label className="font-pixel text-xs text-gray-300 block mb-2">
                EMAIL
              </label>
              <input
                type="email"
                value={form.email}
                onChange={update('email')}
                required
                autoComplete="email"
                placeholder="you@email.com"
                className={inputClass}
              />
            </div>

            {/* Password */}
            <div>
              <label className="font-pixel text-xs text-gray-300 block mb-2">
                PASSWORD
              </label>
              <input
                type="password"
                value={form.password}
                onChange={update('password')}
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="At least 6 characters"
                className={inputClass}
              />
            </div>

            {/* Questionnaire divider */}
            <div className="flex items-center gap-2 pt-2">
              <div className="flex-1 h-px bg-gray-700" />
              <span className="font-pixel text-[8px] text-gray-500">A FEW QUESTIONS</span>
              <div className="flex-1 h-px bg-gray-700" />
            </div>

            {/* Q1 — medical */}
            <div>
              <label className="font-pixel text-xs text-gray-300 block mb-2">
                1. ANY HEALTH CONDITIONS WE SHOULD KNOW ABOUT?
              </label>
              <p className="font-pixel text-[9px] text-gray-500 leading-relaxed mb-2">
                Got any illness, disability, or medical condition? Your answer is
                kept private — it just helps the committee look after you during
                orientation. 💙
              </p>
              <textarea
                value={form.medicalNote}
                onChange={update('medicalNote')}
                required
                rows={3}
                placeholder={`Type "none" if this doesn't apply to you`}
                className={inputClass}
              />
            </div>

            {/* Q2 — achievements */}
            <div>
              <label className="font-pixel text-xs text-gray-300 block mb-2">
                2. ANY ACHIEVEMENTS YOU&apos;RE PROUD OF?
              </label>
              <p className="font-pixel text-[9px] text-gray-500 leading-relaxed mb-2">
                Tell us about something you&apos;ve accomplished — awards, projects,
                competitions, anything! 🏆
              </p>
              <textarea
                value={form.achievements}
                onChange={update('achievements')}
                required
                rows={3}
                placeholder={`Type "none" if you'd rather skip this`}
                className={inputClass}
              />
            </div>

            {/* Q3 — instagram (optional) */}
            <div>
              <label className="font-pixel text-xs text-gray-300 block mb-2">
                3. WHAT&apos;S YOUR INSTAGRAM? <span className="text-gray-500">(OPTIONAL)</span>
              </label>
              <p className="font-pixel text-[9px] text-gray-500 leading-relaxed mb-2">
                Drop your handle so we can connect — totally up to you. 📸
              </p>
              <input
                type="text"
                value={form.instagram}
                onChange={update('instagram')}
                placeholder="@yourhandle"
                className={inputClass}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full font-pixel text-sm text-black
                bg-yellow-400 hover:bg-yellow-300
                border-4 border-black py-4 px-6
                transition-all duration-75
                active:translate-x-1 active:translate-y-1
                disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ boxShadow: '4px 4px 0px #000' }}
            >
              {loading ? (
                <span className="blink">⏳ CREATING...</span>
              ) : (
                <>✨ START ADVENTURE</>
              )}
            </button>

            {error && (
              <div className="p-3 bg-red-900 border-2 border-red-500">
                <p className="font-pixel text-xs text-red-300">❌ {error}</p>
              </div>
            )}

            {/* Login link */}
            <div className="text-center">
              <p className="font-pixel text-xs text-gray-400">
                ALREADY HAVE AN ACCOUNT?{' '}
                <Link href="/login" className="text-yellow-400 hover:text-yellow-300 underline">
                  LOG IN
                </Link>
              </p>
            </div>
          </form>
        </PixelCard>

        <p className="text-center font-pixel text-xs text-gray-600 mt-6">
          © NSO 2026 COMMITTEE
        </p>
      </div>
    </div>
  )
}
