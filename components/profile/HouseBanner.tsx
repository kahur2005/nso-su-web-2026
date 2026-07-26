// components/profile/HouseBanner.tsx
// The "HOUSE OF" pennant beside the stat cards. Drawn in CSS rather than
// exported: sprite exports out of this Figma file carry stray near-white edge
// pixels, and the shape is a flat fill, a crossbar and a notch.
//
// clip-path removes any real border, so the #3e2723 outline is four 2px
// drop-shadows, which trace the clipped silhouette including the bottom point.
// The shape is its own absolutely-positioned layer with the content sitting
// above it: `filter` applies to an element's whole subtree, so painting the
// pennant and its text together would outline every glyph and the mascot too.
//
// The fill is the group's own colour, so the name is cream rather than the
// frame's tan #d37a38 — tan vanishes against a yellow or orange house.
const PENNANT_FALLBACK = '#bf360c'
const TIP_DEPTH = 44 // px, measured off the frame

interface HouseBannerProps {
  groupName: string | null
  groupColor: string | null
  mascotSrc: string | null
}

export default function HouseBanner({ groupName, groupColor, mascotSrc }: HouseBannerProps) {
  const fill = groupColor || PENNANT_FALLBACK

  return (
    <div className="relative w-[118px] shrink-0 sm:w-[132px]">
      {/* Shape layer: fill, notch and outline only — never text. */}
      <div
        className="absolute inset-0"
        style={{
          // Vertical cloth streaks over the house colour.
          background: `repeating-linear-gradient(90deg, ${fill} 0 3px, rgba(0,0,0,0.10) 3px 4px)`,
          clipPath: `polygon(0 0, 100% 0, 100% calc(100% - ${TIP_DEPTH}px), 50% 100%, 0 calc(100% - ${TIP_DEPTH}px))`,
          filter:
            'drop-shadow(2px 0 0 #3e2723) drop-shadow(-2px 0 0 #3e2723) drop-shadow(0 2px 0 #3e2723) drop-shadow(0 -2px 0 #3e2723)',
        }}
      >
        {/* Darker crossbar across the top of the pennant */}
        <div className="absolute inset-x-0 top-0 h-[5px] bg-[#a62700]" />
      </div>

      {/* Content layer: sits above the shape and drives the wrapper's height. */}
      <div
        className="relative flex flex-col items-center gap-2 px-2 pt-3"
        style={{ paddingBottom: TIP_DEPTH + 8 }}
      >
        <p
          className="font-bytebounce text-[15px] leading-none text-[#ffecb3] sm:text-[16px]"
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
            className="h-[76px] w-[76px] object-contain sm:h-[88px] sm:w-[88px]"
            style={{ imageRendering: 'pixelated' }}
          />
        ) : (
          <span className="text-4xl" aria-hidden>🛡️</span>
        )}

        <p
          className="w-full break-words text-center font-bytebounce text-[20px] leading-none text-[#ffecb3] sm:text-[22px]"
          style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.45)' }}
        >
          {groupName ?? 'Unassigned'}
        </p>
      </div>
    </div>
  )
}
