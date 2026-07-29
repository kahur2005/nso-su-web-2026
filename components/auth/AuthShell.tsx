// components/auth/AuthShell.tsx
//
// The forest-background + crest frame shared by the forgot/reset password
// screens, lifted from app/(auth)/login/page.tsx so the three read as one flow.
// Login itself still inlines its own copy — this exists for the new pages
// rather than as a refactor of a page that already works.
import Link from 'next/link'

export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-dvh w-full overflow-y-auto">
      <img
        src="/images/login/bg.png"
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover object-[31%_50%] lg:object-center"
      />

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-sm flex-col items-center px-6 py-8 lg:max-w-md">
        <img
          src="/images/login/logo-512.png"
          alt="NSO 2026"
          className="mt-2 w-32 lg:w-40"
        />

        <h1
          className="mt-4 text-center font-bytebounce text-[clamp(2.5rem,15vw,4rem)] leading-[0.85] text-[#fbc94c] lg:text-[4.25rem]"
          style={{ textShadow: '4px 4px 0 #4e342e' }}
        >
          {title}
        </h1>

        {subtitle && (
          <p
            className="mt-3 text-center font-bytebounce text-[20px] leading-tight text-[#e0b391]"
            style={{ textShadow: '2px 1.4px 0 #4e342e' }}
          >
            {subtitle}
          </p>
        )}

        <div className="mt-auto w-full pt-10">{children}</div>

        <Link
          href="/login"
          className="mt-6 font-bytebounce text-[20px] text-[#e0b391] underline-offset-4 hover:underline"
          style={{ textShadow: '2px 1.4px 0 #4e342e' }}
        >
          Back to login
        </Link>
      </div>
    </div>
  )
}

/** Shared input styling so the auth screens stay visually identical. */
export const authInputClass =
  'mt-1 h-[52px] w-full rounded-[13px] border-2 border-[#e0b391] bg-white px-4 font-bytebounce text-[22px] text-[#4e342e] placeholder:text-[#c9b6a4] focus:border-[#fbc94c] focus:outline-none'

/** Shared label styling. */
export const authLabelClass = 'block font-bytebounce text-[22px] text-[#e0b391]'

export const authLabelShadow = { textShadow: '2px 1.4px 0 #4e342e' } as const

export const authButtonClass =
  'wood-plank mt-8 block h-[52px] w-full font-bytebounce text-[28px] text-[#e0b391] transition-transform duration-75 hover:brightness-110 active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60'

export const authButtonShadow = { textShadow: '2.7px 1.8px 0 #4e342e' } as const
