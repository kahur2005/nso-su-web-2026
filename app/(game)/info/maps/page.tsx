'use client'
import { useState } from 'react'
import PageWrapper from '@/components/layout/PageWrapper'

interface Floor {
  id: string
  title: string
  src: string
}

const floors: Floor[] = [
  {
    id: '19th',
    title: '19th Floor',
    src: '/images/map/floor-19.png',
  },
  {
    id: '7th',
    title: '7th Floor',
    src: '/images/map/floor-7.png',
  },
  {
    id: '6th',
    title: '6th Floor',
    src: '/images/map/floor-6.png',
  },
  {
    id: 'lg',
    title: 'Lower Ground Floor',
    src: '/images/map/floor-ground.png',
  },
]

const GREEN_TITLE = {
  color: '#38db43',
  textShadow:
    '3px 3px 0 #125615, -3px 3px 0 #125615, 3px -3px 0 #125615, -3px -3px 0 #125615, 0 5px 0 #125615',
}

const SCROLL_ART_BLEED = '18.59%'
const SCROLL_MARGIN_X = '3%'
const SCROLL_PAD_X = '2.5%'
const SCROLL_PAD_TOP = '20%'
const SCROLL_PAD_BOTTOM = '18%'

export default function CampusMapPage() {
  const [zoomedFloor, setZoomedFloor] = useState<Floor | null>(null)

  return (
    <PageWrapper>
      <div className="relative game-column overflow-x-clip pb-12 pt-6">
        {/* Header Title */}
        <h1
          className="text-center font-bytebounce text-[clamp(3.6rem,16vw,4.8rem)] leading-[0.85]"
          style={GREEN_TITLE}
        >
          MAP
        </h1>

        {/* Parchment Scroll Frame containing all floor maps vertically */}
        <div
          className="relative mt-4"
          style={{ marginLeft: SCROLL_MARGIN_X, marginRight: SCROLL_MARGIN_X }}
        >
          <div
            aria-hidden
            className="absolute inset-y-0 flex flex-col"
            style={{ left: `-${SCROLL_ART_BLEED}`, right: `-${SCROLL_ART_BLEED}` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/committee/scroll-top.png" alt="" className="w-full" />
            <div
              className="-my-px flex-1"
              style={{
                backgroundImage: 'url(/images/committee/scroll-mid.png)',
                backgroundRepeat: 'repeat-y',
                backgroundSize: '100% auto',
              }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/committee/scroll-bottom.png" alt="" className="w-full" />
          </div>

          {/* Scroll Contents */}
          <div
            className="relative flex flex-col gap-10"
            style={{
              paddingLeft: SCROLL_PAD_X,
              paddingRight: SCROLL_PAD_X,
              paddingTop: SCROLL_PAD_TOP,
              paddingBottom: SCROLL_PAD_BOTTOM,
            }}
          >
            {floors.map((floor) => (
              <div key={floor.id} className="flex flex-col items-center">
                {/* Header Text */}
                <h2
                  className="font-bytebounce text-[clamp(30px,9vw,42px)] leading-none text-[#3e2723]"
                  style={{ textShadow: '1px 1px 0 #fff' }}
                >
                  {floor.title}
                </h2>

                {/* Map Image Container with Tap to Zoom */}
                <div
                  className="group relative mt-3 w-full cursor-pointer overflow-hidden rounded-md border-2 border-[#3e2723] bg-[#fbf0cb] p-1.5 shadow-md transition-transform hover:scale-[1.01]"
                  onClick={() => setZoomedFloor(floor)}
                  title={`Tap to zoom ${floor.title} map`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={floor.src}
                    alt={floor.title}
                    className="block h-auto w-full rounded object-contain"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  <div className="absolute bottom-2 right-2 rounded bg-[#3e2723]/85 px-2.5 py-1 font-bytebounce text-[15px] text-[#ffd23f] opacity-90 transition-opacity group-hover:opacity-100">
                    🔍 Tap to zoom
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Zoom Modal */}
        {zoomedFloor && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
            onClick={() => setZoomedFloor(null)}
          >
            <div
              className="relative max-h-[92vh] max-w-[96vw] overflow-auto rounded-lg border-2 border-[#ffd23f] bg-[#3e2723] p-3 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-2 flex items-center justify-between px-1">
                <h3 className="font-bytebounce text-[24px] text-[#ffd23f]">
                  {zoomedFloor.title}
                </h3>
                <button
                  onClick={() => setZoomedFloor(null)}
                  className="rounded bg-[#ff180e] px-3 py-1 font-bytebounce text-[18px] text-white hover:brightness-110 active:translate-y-0.5"
                >
                  ✕ Close
                </button>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={zoomedFloor.src}
                alt={zoomedFloor.title}
                className="h-auto max-h-[80vh] w-auto max-w-full object-contain mx-auto rounded border border-[#b08a5e]"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
