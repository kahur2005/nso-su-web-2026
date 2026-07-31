// components/lunch/Parchment.tsx
// The parchment slab the quest board uses, reused as the lunch card surface so
// the two boards read as the same app.
//
// Drawn with border-image rather than `backgroundSize: 100% 100%` (which is
// what app/(game)/quests/page.tsx does). That distinction matters here: the
// sprite is 365x72 with a decorative border only a few pixels thick, so
// stretching it to fit scales the border PROPORTIONALLY. On a short quest card
// that is invisible, but on a tall panel — the QR payment plate, say — the
// border balloons into a thick band that swallows the padding and leaves text
// sitting on the frame.
//
// border-image slices the edges at their native size and stretches only the
// flat middle, so the frame stays the same thickness whatever the panel's
// height, and padding is measured from real paper.
import type { ElementType } from 'react'

/** Native pixels of the sprite reserved for the frame on each side. */
const EDGE = 12

export default function Parchment({
  as: Tag = 'div',
  className = '',
  children,
}: {
  as?: ElementType
  className?: string
  children: React.ReactNode
}) {
  return (
    <Tag
      className={`relative ${className}`}
      style={{
        borderStyle: 'solid',
        borderWidth: EDGE,
        borderImageSource: 'url(/images/quests/paper.png)',
        // `fill` also paints the sprite's middle across the content box, so the
        // panel needs no separate background layer.
        borderImageSlice: `${EDGE} fill`,
        borderImageRepeat: 'stretch',
        imageRendering: 'pixelated',
      }}
    >
      {children}
    </Tag>
  )
}

/** The solid pixel chevron marking a card you can tap into. */
export function Chevron() {
  return (
    <span
      aria-hidden
      className="ml-1 shrink-0 self-center"
      style={{
        width: 0,
        height: 0,
        borderTop: '9px solid transparent',
        borderBottom: '9px solid transparent',
        borderLeft: '12px solid #5d4037',
      }}
    />
  )
}
