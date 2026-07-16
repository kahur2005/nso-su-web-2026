'use client'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import PixelAvatar from '@/components/ui/PixelAvatar'

const TOTAL_STEPS = 5

const STEP_TITLES: [string, string][] = [
  ["Let's get", 'started'],
  ['About', 'you'],
  ['Your', 'story'],
  ['Your', 'avatar!'],
  ['Last', 'step!'],
]

const labelClass = 'block font-bytebounce text-[22px] text-[#e0b391]'
const labelShadow = { textShadow: '2px 1.4px 0 #4e342e' }
const inputClass =
  'mt-1 w-full rounded-[13px] border-2 border-[#e0b391] bg-white px-4 font-bytebounce text-[22px] text-[#4e342e] placeholder:text-[#c9b6a4] focus:border-[#fbc94c] focus:outline-none'

// ── Avatar option data ──────────────────────────────────────────────────────
const SKINS = ['skin1', 'skin2', 'skin3', 'skin4', 'skin5', 'skin6', 'skin7', 'skin8', 'skin9']
const EYES = Array.from({ length: 16 }, (_, i) => `eyes${i + 1}`)
const BROWS = Array.from({ length: 18 }, (_, i) => `brow${i + 1}`)

// Hair options: base key used for the file path + display label
const HAIR_STYLES = [
  { key: null,      label: 'Bald' },
  { key: 'hairb1',   label: 'Short A' },
  { key: 'hairb2',   label: 'Short B' },
  { key: 'hairb3',   label: 'Short C' },
  { key: 'hairb4',   label: 'Short D' },
  { key: 'hairg1',   label: 'Long A' },
  { key: 'hairg2',   label: 'Long B' },
  { key: 'hairg3',   label: 'Long C' },
  { key: 'hairg4',   label: 'Long D' },
  { key: 'hairg5',   label: 'Long E' },
]

// Color variants per hair style (suffix appended to key)
const HAIR_COLORS: { suffix: string; label: string; swatch: string }[] = [
  { suffix: '',    label: 'Dark',  swatch: '#2c1a0e' },
  { suffix: '.2',  label: 'Brown', swatch: '#6b3a1f' },
  { suffix: '.3',  label: 'Light', swatch: '#c68642' },
]
// ───────────────────────────────────────────────────────────────────────────

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
  const [avatarSkin, setAvatarSkin] = useState('skin1')
  const [avatarHairStyle, setAvatarHairStyle] = useState<string | null>('hairb1')
  const [avatarHairColor, setAvatarHairColor] = useState('')
  const [avatarEyes, setAvatarEyes] = useState('eyes1')
  const [avatarBrows, setAvatarBrows] = useState('brow1')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const hairKey = avatarHairStyle ? `${avatarHairStyle}${avatarHairColor}` : null

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
          avatarSkin,
          avatarHair: hairKey,
          avatarEyes,
          avatarBrows,
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
    <div className="relative min-h-dvh w-full overflow-y-auto">
      <img
        src="/images/login/bg.png"
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover object-[31%_50%] lg:object-center"
      />

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
          {/* ── Step 0: Credentials ── */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <label htmlFor="email" className={labelClass} style={labelShadow}>
                  Email
                </label>
                <input
                  id="email" type="email" value={form.email}
                  onChange={update('email')} required autoComplete="email"
                  placeholder="you@email.com" className={`${inputClass} h-[52px]`}
                />
              </div>
              <div>
                <label htmlFor="password" className={labelClass} style={labelShadow}>
                  Password
                </label>
                <input
                  id="password" type="password" value={form.password}
                  onChange={update('password')} required minLength={6}
                  autoComplete="new-password" placeholder="At least 6 characters"
                  className={`${inputClass} h-[52px]`}
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className={labelClass} style={labelShadow}>
                  Confirm password
                </label>
                <input
                  id="confirmPassword" type="password" value={form.confirmPassword}
                  onChange={update('confirmPassword')} required minLength={6}
                  autoComplete="new-password" placeholder="Repeat your password"
                  className={`${inputClass} h-[52px]`}
                />
              </div>
              <div>
                <label htmlFor="instagram" className={labelClass} style={labelShadow}>
                  Instagram profile link
                </label>
                <input
                  id="instagram" type="text" value={form.instagram}
                  onChange={update('instagram')} autoComplete="off"
                  placeholder="@yourhandle (optional)"
                  className={`${inputClass} h-[52px]`}
                />
              </div>
            </div>
          )}

          {/* ── Step 1: About you ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label htmlFor="fullName" className={labelClass} style={labelShadow}>
                  Name
                </label>
                <input
                  id="fullName" type="text" value={form.name}
                  onChange={update('name')} required autoComplete="name"
                  placeholder="Your full name" className={`${inputClass} h-[52px]`}
                />
              </div>
              <div>
                <label htmlFor="major" className={labelClass} style={labelShadow}>
                  Major
                </label>
                <input
                  id="major" type="text" value={form.major}
                  onChange={update('major')} required
                  placeholder="e.g. Computer Science"
                  className={`${inputClass} h-[52px]`}
                />
              </div>
            </div>
          )}

          {/* ── Step 2: Your story ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label htmlFor="hobby" className={labelClass} style={labelShadow}>
                  Your hobby
                </label>
                <input
                  id="hobby" type="text" value={form.hobby}
                  onChange={update('hobby')} required
                  placeholder="e.g. football, drawing, gaming"
                  className={`${inputClass} h-[52px]`}
                />
              </div>
              <div>
                <label htmlFor="achievements" className={labelClass} style={labelShadow}>
                  Past achievement or award you&apos;re proud of
                </label>
                <textarea
                  id="achievements" value={form.achievements}
                  onChange={update('achievements')} required rows={4}
                  placeholder={`Awards, projects, competitions — type "none" to skip`}
                  className={`${inputClass} py-3`}
                />
              </div>
            </div>
          )}

          {/* ── Step 3: Avatar customization ── */}
          {step === 3 && (
            <div className="space-y-5">
              {/* Live preview */}
              <div className="flex justify-center">
                <div className="flex flex-col items-center gap-2">
                  <PixelAvatar skin={avatarSkin} hair={hairKey} eyes={avatarEyes} brow={avatarBrows} size={112} />
                  <p className="font-bytebounce text-[13px] text-[#fbc94c]" style={labelShadow}>
                    Your avatar
                  </p>
                </div>
              </div>

              {/* Skin picker */}
              <div>
                <p className={labelClass} style={labelShadow}>Skin tone</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {SKINS.map((s) => (
                    <button
                      key={s} type="button"
                      onClick={() => setAvatarSkin(s)}
                      className="relative border-2 rounded transition-transform active:scale-95"
                      style={{
                        borderColor: avatarSkin === s ? '#fbc94c' : '#e0b391',
                        boxShadow: avatarSkin === s ? '0 0 0 2px #fbc94c' : 'none',
                      }}
                    >
                      <img
                        src={`/images/avatar/${s}.png`}
                        alt={s}
                        className="w-12 h-12 object-contain"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Eyes picker */}
              <div>
                <p className={labelClass} style={labelShadow}>Eyes Style</p>
                <div className="mt-2 flex gap-2 overflow-x-auto py-1 scrollbar-thin">
                  {EYES.map((e) => (
                    <button
                      key={e} type="button"
                      onClick={() => setAvatarEyes(e)}
                      className="relative border-2 rounded transition-transform active:scale-95 bg-white/80 p-0.5"
                      style={{
                        borderColor: avatarEyes === e ? '#fbc94c' : '#e0b391',
                        boxShadow: avatarEyes === e ? '0 0 0 2px #fbc94c' : 'none',
                      }}
                    >
                      <PixelAvatar skin={avatarSkin} eyes={e} size={44} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Brows picker */}
              <div>
                <p className={labelClass} style={labelShadow}>Eyebrows Style</p>
                <div className="mt-2 flex gap-2 overflow-x-auto py-1 scrollbar-thin">
                  {BROWS.map((b) => (
                    <button
                      key={b} type="button"
                      onClick={() => setAvatarBrows(b)}
                      className="relative border-2 rounded transition-transform active:scale-95 bg-white/80 p-0.5"
                      style={{
                        borderColor: avatarBrows === b ? '#fbc94c' : '#e0b391',
                        boxShadow: avatarBrows === b ? '0 0 0 2px #fbc94c' : 'none',
                      }}
                    >
                      <PixelAvatar skin={avatarSkin} eyes={avatarEyes} brow={b} size={44} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Hair style picker */}
              <div>
                <p className={labelClass} style={labelShadow}>Hair style</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {HAIR_STYLES.map((h) => (
                    <button
                      key={h.key ?? 'bald'} type="button"
                      onClick={() => setAvatarHairStyle(h.key)}
                      className="relative border-2 rounded transition-transform active:scale-95 bg-white/80"
                      style={{
                        borderColor: avatarHairStyle === h.key ? '#fbc94c' : '#e0b391',
                        boxShadow: avatarHairStyle === h.key ? '0 0 0 2px #fbc94c' : 'none',
                      }}
                    >
                      {h.key ? (
                        <img
                          src={`/images/avatar/${h.key}.png`}
                          alt={h.label}
                          className="w-12 h-12 object-contain"
                          style={{ imageRendering: 'pixelated' }}
                        />
                      ) : (
                        <div className="w-12 h-12 flex items-center justify-center font-bytebounce text-[10px] text-[#4e342e]">
                          Bald
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hair color picker (only when a style is selected) */}
              {avatarHairStyle && (
                <div>
                  <p className={labelClass} style={labelShadow}>Hair color</p>
                  <div className="mt-2 flex gap-3">
                    {HAIR_COLORS.map((c) => (
                      <button
                        key={c.suffix} type="button"
                        onClick={() => setAvatarHairColor(c.suffix)}
                        className="flex flex-col items-center gap-1"
                      >
                        <div
                          className="w-8 h-8 border-2 rounded-full transition-transform active:scale-95"
                          style={{
                            background: c.swatch,
                            borderColor: avatarHairColor === c.suffix ? '#fbc94c' : '#e0b391',
                            boxShadow: avatarHairColor === c.suffix ? '0 0 0 2px #fbc94c' : 'none',
                          }}
                        />
                        <span className="font-bytebounce text-[10px] text-[#e0b391]">{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Step 4: Health / allergies ── */}
          {step === 4 && (
            <div>
              <label htmlFor="medicalNote" className={labelClass} style={labelShadow}>
                Allergies or health conditions we should know?
              </label>
              <p
                className="mt-2 font-bytebounce text-[16px] leading-tight text-[#24e9d5]"
                style={{ textShadow: '1.2px 1px 0 #4e342e' }}
              >
                Kept private — helps the committee keep you safe during orientation.
              </p>
              <textarea
                id="medicalNote" value={form.medicalNote}
                onChange={update('medicalNote')} required rows={5}
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
