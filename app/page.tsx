// app/page.tsx
// Public landing page — shown before login.
// Shows a live countdown to the NSO event start date (NEXT_PUBLIC_NSO_EVENT_DATE).
// Once the event has started the countdown is replaced with "NSO IS LIVE!".
import Link from 'next/link'
import CountdownTimer from '@/components/ui/CountdownTimer'

// Set NEXT_PUBLIC_NSO_EVENT_DATE in .env.local to override. Default matches
// Day 1 in lib/timeline.ts (18 Aug 2026, 08:00 WIB).
const EVENT_DATE_ISO =
  process.env.NEXT_PUBLIC_NSO_EVENT_DATE ?? '2026-08-18T08:00:00+07:00'

export default function HomePage() {
  const eventDate = new Date(EVENT_DATE_ISO)
  const isLive = Date.now() >= eventDate.getTime()

  return (
    <main className="flex min-h-dvh w-full items-center justify-center bg-[#000b8c] px-5 py-10">
      <div className="w-full max-w-[380px] overflow-hidden rounded-[10px] bg-white pb-14 shadow-[0px_4px_4px_rgba(0,0,0,0.25)] lg:max-w-[420px]">
        {/* University logos */}
        <div className="flex items-start justify-between px-4 pt-4">
          <div className="flex items-center gap-1.5">
            <img
              src="/images/home/sampoerna-mark.png"
              alt=""
              className="h-14 w-auto"
            />
            <div className="font-campton text-[11px] font-semibold leading-snug tracking-[0.04em]">
              <p className="text-[#000b8c]">SAMPOERNA</p>
              <p className="text-[#00a6ce]">UNIVERSITY</p>
            </div>
          </div>
          <img
            src="/images/home/arizona.png"
            alt="The University of Arizona"
            className="size-16 object-contain"
          />
        </div>

        {/* NSO 2026 crest */}
        <img
          src="/images/login/logo-512.png"
          alt="NSO 2026"
          className="mx-auto -mt-2 w-[54%]"
        />

        {/* Gold welcome band */}
        <div className="bg-[#d2ae65] py-2.5 text-center">
          <p className="font-campton text-[21px] font-semibold tracking-[0.02em] text-white">
            Welcome to the Family!
          </p>
        </div>

        {/* Countdown or LIVE indicator */}
        <div className="flex flex-col items-center px-6 pt-6">
          {isLive ? (
            <div className="w-full rounded-lg bg-[#000b8c] py-3 text-center">
              <p className="font-bytebounce text-[20px] text-[#fbc94c]">
                🎉 NSO IS LIVE!
              </p>
            </div>
          ) : (
            <>
              <p className="mb-3 font-campton text-[13px] font-semibold tracking-[0.06em] text-[#667085] uppercase">
                Orientation starts in
              </p>
              {/* CountdownTimer is a client component — rendered client-side */}
              <CountdownTimer targetDate={eventDate} />
            </>
          )}
        </div>

        {/* CTA */}
        <div className="px-6 pt-8">
          <Link
            href="/login"
            className="block rounded-[4px] bg-[#000b8c] py-1.5 text-center font-adamina text-[14px] tracking-[0.03em] text-white shadow-[0px_4px_4px_rgba(0,0,0,0.25)] transition-colors hover:bg-[#0018c4] active:bg-[#000970]"
          >
            Start your journey!
          </Link>
        </div>
      </div>
    </main>
  )
}
