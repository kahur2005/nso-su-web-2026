// components/lunch/LunchShell.tsx
// The frame every /lunch screen sits in: the jungle backdrop, the back button
// and the gold section title, matching /quests. Factored out because there are
// five lunch screens and the alternative is five copies of the same 30 lines.
'use client'
import { useRouter } from 'next/navigation'
import PageWrapper from '@/components/layout/PageWrapper'

export default function LunchShell({
  title,
  subtitle,
  backHref,
  children,
}: {
  title: string
  subtitle?: string
  /** Where the back button goes. Defaults to the lunch landing page. */
  backHref?: string
  children: React.ReactNode
}) {
  const router = useRouter()

  return (
    <PageWrapper>
      {/* Renders after PageWrapper's sky layer at the same z-index, so it wins.
          Same art and treatment as /quests and /scan. */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-bottom"
        style={{ backgroundImage: 'url(/images/scan/bg.png)' }}
      />

      <div className="relative game-column pb-4 pt-14">
        <button
          type="button"
          onClick={() => router.push(backHref ?? '/lunch')}
          aria-label="Go back"
          className="absolute left-2 top-0 z-20 w-[64px] transition-transform duration-75 hover:brightness-110 active:translate-y-0.5"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/login/back-button.png" alt="" className="w-full" />
        </button>

        <div className="px-1">
          <h1 className="title-gold font-bytebounce text-[30px] leading-none sm:text-[34px]">
            {title}
          </h1>
          {subtitle && (
            <p
              className="mt-1.5 font-bytebounce text-[17px] leading-tight text-white"
              style={{ textShadow: '2px 2px 0 #3e2723' }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {children}
      </div>
    </PageWrapper>
  )
}
