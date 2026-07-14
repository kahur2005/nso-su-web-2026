'use client'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const TOTAL_STEPS = 4

const STEP_TITLES: [string, string][] = [
  ["Let's get", 'started'],
  ['About', 'you'],
  ['Your', 'story'],
  ['Last', 'step!'],
]

const labelClass = 'block font-bytebounce text-[22px] text-[#e0b391]'
const labelShadow = { textShadow: '2px 1.4px 0 #4e342e' }
const inputClass =
  'mt-1 w-full rounded-[13px] border-2 border-[#e0b391] bg-white px-4 font-bytebounce text-[22px] text-[#4e342e] placeholder:text-[#c9b6a4] focus:border-[#fbc94c] focus:outline-none'

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    instagram: '',
    major: '',
    hobby: '',
    achievements: '',
    medicalNote: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const update = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))

  const goBack = () => {
    setError('')
    if (step === 0) {
      router.push('/login')
    } else {
      setStep(step - 1)
    }
  }

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (step === 0 && form.password !== form.confirmPassword) {
      setError('Passwords do not match!')
      return
    }

    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1)
      return
    }

    // Final step — register, then auto sign-in.
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          instagram: form.instagram,
          major: form.major,
          hobby: form.hobby,
          achievements: form.achievements,
          medicalNote: form.medicalNote,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Registration failed.')
        setLoading(false)
        return
      }

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
      setError('Connection error. Try again.')
      setLoading(false)
    }
  }

  const [titleTop, titleBottom] = STEP_TITLES[step]
  const isLastStep = step === TOTAL_STEPS - 1

  return (
    <div className="relative min-h-dvh w-full overflow-hidden">
      {/* Illustrated forest background — same crop as /login on mobile */}
      <img
        src="/images/login/bg.png"
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover object-[31%_50%] lg:object-center"
      />

      {/* Back button */}
      <button
        type="button"
        onClick={goBack}
        aria-label={step === 0 ? 'Back to login' : 'Previous step'}
        className="absolute left-5 top-8 z-20 w-[64px] transition-transform duration-75 hover:brightness-110 active:translate-y-0.5"
      >
        <img src="/images/login/back-button.png" alt="" className="w-full" />
      </button>

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-sm flex-col px-6 pb-8 pt-28 lg:max-w-md">
        {/* Title */}
        <h1 className="text-center font-bytebounce leading-[0.9] text-[#fbc94c]">
          <span
            className="block text-[clamp(2.75rem,15vw,4rem)] lg:text-[4.25rem]"
            style={{ textShadow: '3.4px 3.1px 0 #4e342e' }}
          >
            {titleTop}
          </span>
          <span
            className="block text-[clamp(2.75rem,15vw,4rem)] lg:text-[4.25rem]"
            style={{ textShadow: '3.4px 3.1px 0 #4e342e' }}
          >
            {titleBottom}
          </span>
        </h1>

        <p
          className="mt-2 text-center font-bytebounce text-[18px] text-[#e0b391]"
          style={labelShadow}
        >
          Step {step + 1} of {TOTAL_STEPS}
        </p>

        <form onSubmit={handleNext} className="mt-8 flex w-full flex-1 flex-col">
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <label htmlFor="email" className={labelClass} style={labelShadow}>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={update('email')}
                  required
                  autoComplete="email"
                  placeholder="you@email.com"
                  className={`${inputClass} h-[52px]`}
                />
              </div>
              <div>
                <label htmlFor="password" className={labelClass} style={labelShadow}>
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={update('password')}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  className={`${inputClass} h-[52px]`}
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className={labelClass} style={labelShadow}>
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={update('confirmPassword')}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  className={`${inputClass} h-[52px]`}
                />
              </div>
              <div>
                <label htmlFor="instagram" className={labelClass} style={labelShadow}>
                  Instagram profile link
                </label>
                <input
                  id="instagram"
                  type="text"
                  value={form.instagram}
                  onChange={update('instagram')}
                  autoComplete="off"
                  placeholder="@yourhandle (optional)"
                  className={`${inputClass} h-[52px]`}
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label htmlFor="fullName" className={labelClass} style={labelShadow}>
                  Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={form.name}
                  onChange={update('name')}
                  required
                  autoComplete="name"
                  placeholder="Your full name"
                  className={`${inputClass} h-[52px]`}
                />
              </div>
              <div>
                <label htmlFor="major" className={labelClass} style={labelShadow}>
                  Major
                </label>
                <input
                  id="major"
                  type="text"
                  value={form.major}
                  onChange={update('major')}
                  required
                  placeholder="e.g. Computer Science"
                  className={`${inputClass} h-[52px]`}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label htmlFor="hobby" className={labelClass} style={labelShadow}>
                  Your hobby
                </label>
                <input
                  id="hobby"
                  type="text"
                  value={form.hobby}
                  onChange={update('hobby')}
                  required
                  placeholder="e.g. football, drawing, gaming"
                  className={`${inputClass} h-[52px]`}
                />
              </div>
              <div>
                <label htmlFor="achievements" className={labelClass} style={labelShadow}>
                  An achievement you&apos;re proud of
                </label>
                <textarea
                  id="achievements"
                  value={form.achievements}
                  onChange={update('achievements')}
                  required
                  rows={4}
                  placeholder={`Awards, projects, competitions — type "none" to skip`}
                  className={`${inputClass} py-3`}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <label htmlFor="medicalNote" className={labelClass} style={labelShadow}>
                Any health or condition we should know about you?
              </label>
              <p
                className="mt-2 font-bytebounce text-[16px] leading-tight text-[#24e9d5]"
                style={{ textShadow: '1.2px 1px 0 #4e342e' }}
              >
                Kept private, it just helps the committee look after you during
                orientation.
              </p>
              <textarea
                id="medicalNote"
                value={form.medicalNote}
                onChange={update('medicalNote')}
                required
                rows={5}
                placeholder={`Type "none" if this doesn't apply to you`}
                className={`${inputClass} mt-3 py-3`}
              />
            </div>
          )}

          {error && (
            <p
              className="mt-4 text-center font-bytebounce text-[18px] text-[#d6101d]"
              style={{ textShadow: '1.2px 0.7px 0 #e0b391' }}
            >
              {error}
            </p>
          )}

          <div className="mt-auto pt-10">
            <button
              type="submit"
              disabled={loading}
              className="wood-plank block h-[52px] w-full font-bytebounce text-[28px] text-[#e0b391] transition-transform duration-75 hover:brightness-110 active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ textShadow: '2.7px 1.8px 0 #4e342e' }}
            >
              {loading ? (
                <span className="blink">Creating...</span>
              ) : isLastStep ? (
                'Register'
              ) : (
                'Next'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
