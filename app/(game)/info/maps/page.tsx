// app/(game)/info/maps/page.tsx
// Campus Map page — clean vertical scroll of floor plan maps (19th, 7th, 6th, Lower Ground)
// with header text, pixel map images, and full-screen zoom modal.
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

export default function CampusMapPage() {
  const [zoomedFloor, setZoomedFloor] = useState<Floor | null>(null)

  return (
    <PageWrapper>
      <div className="relative game-column pb-12 pt-6">
        {/* Header Title */}
        <h1
          className="text-center font-bytebounce text-[clamp(3.2rem,15vw,4.2rem)] leading-[0.85]"
          style={GREEN_TITLE}
        >
          MAP
        </h1>

        {/* Parchment Scroll Frame containing all floor maps vertically */}
        <div className="relative mt-4">
          <div aria-hidden className="absolute inset-0 flex flex-col">
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
          <div className="relative flex flex-col gap-8 px-[15%] pb-[14%] pt-[16%]">
            {floors.map((floor) => (
              <div key={floor.id} className="flex flex-col items-center">
                {/* Header Text */}
                <h2
                  className="font-bytebounce text-[clamp(26px,8vw,36px)] leading-none text-[#3e2723]"
                  style={{ textShadow: '1px 1px 0 #fff' }}
                >
                  {floor.title}
                </h2>

                {/* Map Image Container with Tap to Zoom */}
                <div
                  className="group relative mt-2 w-full overflow-hidden rounded-md border-2 border-[#3e2723] bg-[#fbf0cb] p-1 shadow-md cursor-pointer transition-transform hover:scale-[1.01]"
                  onClick={() => setZoomedFloor(floor)}
                  title={`Tap to zoom ${floor.title} map`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={floor.src}
                    alt={floor.title}
                    className="h-auto w-full object-contain block rounded"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  <div className="absolute bottom-2 right-2 rounded bg-[#3e2723]/85 px-2 py-0.5 font-bytebounce text-fluid-xs text-[#ffd23f] opacity-90 transition-opacity group-hover:opacity-100">
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
                <h3 className="font-bytebounce text-fluid-xl text-[#ffd23f]">
                  {zoomedFloor.title}
                </h3>
                <button
                  onClick={() => setZoomedFloor(null)}
                  className="rounded bg-[#ff180e] px-3 py-1 font-bytebounce text-fluid-base text-white hover:brightness-110 active:translate-y-0.5"
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
