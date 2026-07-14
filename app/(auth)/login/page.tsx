'use client'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'

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
      setError('Wrong email or password!')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="relative min-h-dvh w-full overflow-hidden">
      {/* Illustrated forest background — mobile shows the left grove like the
          Figma crop, desktop reveals the full scene */}
      <img
        src="/images/login/bg.png"
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover object-[31%_50%] lg:object-center"
      />

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-sm flex-col items-center px-6 py-8 lg:max-w-md">
        {/* Crest logo */}
        <img
          src="/images/login/logo-512.png"
          alt="NSO 2026"
          className="mt-2 w-44 lg:w-56"
        />

        {/* Title */}
        <h1 className="mt-4 text-center font-bytebounce leading-[0.8] text-[#fbc94c]">
          <span
            className="block text-[clamp(3.5rem,22vw,6rem)] lg:text-[6.5rem]"
            style={{ textShadow: '5px 5px 0 #4e342e' }}
          >
            Welcome,
          </span>
          <span
            className="block text-[clamp(2.25rem,14vw,3.75rem)] lg:text-[4rem]"
            style={{ textShadow: '3px 3.3px 0 #4e342e' }}
          >
            New Student!
          </span>
        </h1>

        {/* Register banner line */}
        <p className="mt-4 text-center font-bytebounce text-[19px] leading-none">
          <Link
            href="/register"
            className="wood-plank inline-block px-3 py-2 text-[#7aff06] hover:brightness-110"
            style={{ textShadow: '1.5px 1.3px 0 #4e342e' }}
          >
            Create a new account
          </Link>{' '}
          <span className="text-[#24e9d5]" style={{ textShadow: '1.5px 1.3px 0 #4e342e' }}>
            or login to get started
          </span>
        </p>

        {/* Login form */}
        <form onSubmit={handleLogin} className="mt-auto w-full pt-10">
          <label
            htmlFor="email"
            className="block font-bytebounce text-[22px] text-[#e0b391]"
            style={{ textShadow: '2px 1.4px 0 #4e342e' }}
          >
            Login
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@email.com"
            className="mt-1 h-[52px] w-full rounded-[13px] border-2 border-[#e0b391] bg-white px-4 font-bytebounce text-[22px] text-[#4e342e] placeholder:text-[#c9b6a4] focus:border-[#fbc94c] focus:outline-none"
          />

          <label
            htmlFor="password"
            className="mt-6 block font-bytebounce text-[22px] text-[#e0b391]"
            style={{ textShadow: '2px 1.4px 0 #4e342e' }}
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="mt-1 h-[52px] w-full rounded-[13px] border-2 border-[#e0b391] bg-white px-4 font-bytebounce text-[22px] text-[#4e342e] placeholder:text-[#c9b6a4] focus:border-[#fbc94c] focus:outline-none"
          />

          <p
            className="mt-2 text-right font-bytebounce text-[16px] text-[#d6101d]"
            style={{ textShadow: '1.2px 0.7px 0 #e0b391' }}
          >
            Forgot password?
          </p>

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
            className="wood-plank mt-8 block h-[52px] w-full font-bytebounce text-[28px] text-[#e0b391] transition-transform duration-75 hover:brightness-110 active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            style={{ textShadow: '2.7px 1.8px 0 #4e342e' }}
          >
            {loading ? <span className="blink">Loading...</span> : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}
