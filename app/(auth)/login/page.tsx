'use client'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import PixelCard from '@/components/ui/PixelCard'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (res?.error) {
      setError('WRONG EMAIL OR PASSWORD.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden scanlines"
      style={{
        background: 'linear-gradient(180deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)'
      }}
    >
      {/* Pixel stars background */}
      {[...Array(30)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-white"
          style={{
            top: `${Math.random() * 70}%`,
            left: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.8 + 0.2,
            animation: `blink ${Math.random() * 2 + 1}s infinite`
          }}
        />
      ))}

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="font-pixel text-2xl text-yellow-400"
            style={{ textShadow: '3px 3px 0 #b45309' }}>
            NSO 2026
          </h1>
          <p className="font-pixel text-xs text-gray-400 mt-2">
            PLAYER LOGIN
          </p>
        </div>

        {/* Login Card */}
        <PixelCard className="bg-gray-900/90 border-white/20">
          <form onSubmit={handleLogin} className="p-6">
            {/* Save file icon */}
            <div className="text-6xl mb-4 float inline-block w-full text-center">🏰</div>

            <h2 className="font-pixel text-sm text-white mb-2 text-center">
              WELCOME BACK!
            </h2>
            <p className="font-pixel text-xs text-gray-400 mb-6 text-center">
              LOG IN TO CONTINUE YOUR ADVENTURE
            </p>

            {/* Email */}
            <label className="font-pixel text-xs text-gray-300 block mb-2">
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@email.com"
              className="w-full font-pixel text-xs text-white bg-gray-800
                border-4 border-black py-3 px-3 mb-4
                focus:outline-none focus:border-blue-500
                placeholder:text-gray-600"
            />

            {/* Password */}
            <label className="font-pixel text-xs text-gray-300 block mb-2">
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full font-pixel text-xs text-white bg-gray-800
                border-4 border-black py-3 px-3 mb-6
                focus:outline-none focus:border-blue-500
                placeholder:text-gray-600"
            />

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full font-pixel text-sm text-white
                bg-blue-600 hover:bg-blue-500
                border-4 border-black py-4 px-6
                transition-all duration-75
                active:translate-x-1 active:translate-y-1
                disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ boxShadow: '4px 4px 0px #000' }}
            >
              {loading ? (
                <span className="blink">⏳ LOADING...</span>
              ) : (
                <>🎮 LOG IN</>
              )}
            </button>

            {error && (
              <div className="mt-4 p-3 bg-red-900 border-2 border-red-500">
                <p className="font-pixel text-xs text-red-300">❌ {error}</p>
              </div>
            )}

            {/* Register link */}
            <div className="mt-6 text-center">
              <p className="font-pixel text-xs text-gray-400">
                NEW PLAYER?{' '}
                <Link href="/register" className="text-yellow-400 hover:text-yellow-300 underline">
                  CREATE AN ACCOUNT
                </Link>
              </p>
            </div>

            {/* Info box */}
            <div className="mt-6 p-3 bg-yellow-900/50 border-2 border-yellow-600">
              <p className="font-pixel text-xs text-yellow-300">
                ⚠️ ONLY FOR NSO 2026
              </p>
              <p className="font-pixel text-xs text-yellow-400 mt-1">
                NEW STUDENTS BATCH 2026
              </p>
            </div>
          </form>
        </PixelCard>

        {/* Footer */}
        <p className="text-center font-pixel text-xs text-gray-600 mt-6">
          © NSO 2026 COMMITTEE
        </p>
      </div>
    </div>
  )
}
