/** Base design width of the guidebook container. */
export const BOOK_DESIGN_WIDTH = 387

/** Text scale multiplier for typography in the container grid. */
export const TYPE = 1.1875

/** Convert pixel value to container-relative cqw units. */
export function cqw(px: number, bump = 1): string {
  return `${((px * bump) / BOOK_DESIGN_WIDTH) * 100}cqw`
}
