const PENNANT_FALLBACK = '#bf360c'
const TIP_DEPTH = 44

interface HouseBannerProps {
  groupName: string | null
  groupColor: string | null
  mascotSrc: string | null
}

export default function HouseBanner({ groupName, groupColor, mascotSrc }: HouseBannerProps) {
  const fill = groupColor || PENNANT_FALLBACK

  return (
    <div className="relative w-[180px] shrink-0 -mt-3 -mr-12 -translate-x-3 sm:-mr-16 sm:-mt-4 sm:w-[200px] sm:-translate-x-4">
      {/* Shape layer: using the uploaded group banner image. */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(/images/profile/group-banner.png)',
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          imageRendering: 'pixelated'
        }}
      />

      {/* Content layer: sits above the shape and drives the wrapper's height. */}
      <div
        className="relative flex flex-col items-center gap-3 px-3 pt-6"
        style={{ paddingBottom: TIP_DEPTH + 16 }}
      >
        <p
          className="font-bytebounce text-fluid-xl leading-none text-[#ffecb3]"
          style={{ textShadow: '1px 1px 0 rgba(0,0,0,0.4)' }}
        >
          HOUSE OF
        </p>

        {mascotSrc ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={mascotSrc}
            alt=""
            aria-hidden
            className="h-[80px] w-[80px] object-contain sm:h-[90px] sm:w-[90px]"
            style={{ imageRendering: 'pixelated' }}
          />
        ) : (
          <span className="text-5xl" aria-hidden>🛡️</span>
        )}

        <p
          className="w-full break-words text-center font-bytebounce text-fluid-2xl leading-none text-[#ffecb3]"
          style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.45)' }}
        >
          {/* "None", not "Unassigned" — the long word wraps and overflows the
              pennant, which is only ~180px wide. */}
          {groupName ?? 'None'}
        </p>
      </div>
    </div>
  )
}
