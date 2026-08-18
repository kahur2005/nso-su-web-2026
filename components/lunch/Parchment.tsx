import type { ElementType } from 'react'

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
