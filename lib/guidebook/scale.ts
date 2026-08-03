// lib/guidebook/scale.ts
// The guidebook's interior sizing basis. Pure — no Supabase, safe on the client.
//
// The book art is a 387px-wide pixel-art frame (top cap 387×50, page tile
// 387×40, bottom cap 387×50) that is stretched to whatever width the book
// wrapper gets. Its caps, its repeating ring tile and its content padding are
// all proportional, so anything inside it that is sized in px drifts out of
// proportion with the art as the viewport changes — the book renders at ~0.87×
// on a 360px phone and used to reach 2.07× at 1280px while the type stayed a
// constant 16px.
//
// So the book wrapper carries `container-type: inline-size` and everything
// inside it is expressed in `cqw` against this 387px design grid. Both
// app/(game)/info/guidebook/page.tsx and components/guidebook/ChapterQuiz.tsx
// draw inside that container and must share this basis, which is why it lives
// here rather than in either file.

/** Width of the book art in its native design grid. */
export const BOOK_DESIGN_WIDTH = 387

/**
 * Legibility multiplier applied to type only, never to padding or radii.
 *
 * ByteBounce has a 0.4375em x-height and a 0.5em cap-height (measured from
 * public/fonts/ByteBounce.woff, unitsPerEm 1024), against ~0.52em / ~0.72em for
 * a normal UI font — so 16px of it renders a 7.0px x-height and reads like
 * ~13.5px of Arial. That is what made the guidebook hard to read on a phone.
 * Scaling the panels by the same factor would have just moved the problem, so
 * the bump is deliberately type-only and the panels stay at design proportion.
 */
export const TYPE = 1.1875

/**
 * Convert a design-grid px value to container-relative `cqw`.
 *
 * Pass `TYPE` as `bump` for font sizes; leave it off for padding, gaps, radii
 * and heights so the panel geometry keeps the proportions of the art.
 */
export function cqw(px: number, bump = 1): string {
  return `${((px * bump) / BOOK_DESIGN_WIDTH) * 100}cqw`
}
