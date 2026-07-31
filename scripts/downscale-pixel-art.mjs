// Losslessly downscales the pixel art in public/images/ to its native grid.
//
// Almost all of the game art was exported from Figma at a huge canvas: the
// avatar parts are 32x32 pixel art stored as 1600x1600 PNGs, i.e. every source
// pixel is a flat 50x50 block. That is ~5MB of avatar layers alone, and the
// register page's avatar builder renders the whole catalogue at 44px, so a
// student signing up pulls megabytes to draw thumbnails.
//
// Downscaling such an image by its block size is *lossless*: each block is one
// uniform colour, so sampling one pixel per block throws away nothing, and
// app/globals.css already sets `* { image-rendering: pixelated }` app-wide, so
// the browser upscales it back with nearest-neighbour. The result is
// pixel-identical to what shipped before. public/images/dashboard/food.svg was
// already exported this way (32x32, 2.6KB) next to siblings at 1600x1600 and
// ~75KB -- this script makes the rest match.
//
// Every write is guarded: the downscaled image is re-upscaled in memory and
// compared byte-for-byte against the original. A file is only replaced when
// that comparison passes, so a mis-detected block size can never ship.
//
// Usage: node scripts/downscale-pixel-art.mjs [--dry]
// Safe to re-run: an already-downscaled file has block size 1 and is skipped.
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'
import sharp from 'sharp'

const ROOT = 'public/images'
const DRY = process.argv.includes('--dry')

// Never collapse an image below this on its smaller side. A flat-colour or
// near-flat image can legitimately have an enormous block size (a 40x1575
// plank texture that is one colour would reduce to 1x1). The pixel art we care
// about lands at 32x32, so this floor costs nothing and stops degenerate
// results that would look fine but confuse anyone reading the folder later.
const MIN_SIDE = 8

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name)
    if (entry.isDirectory()) walk(p, acc)
    else acc.push(p)
  }
  return acc
}

const samePixel = (data, ch, i, j) => {
  for (let c = 0; c < ch; c++) if (data[i + c] !== data[j + c]) return false
  return true
}

/** Column indices x where column x differs from column x-1 (and the row twin). */
function boundaries(data, w, h, ch) {
  const xs = []
  for (let x = 1; x < w; x++) {
    for (let y = 0; y < h; y++) {
      if (!samePixel(data, ch, (y * w + x) * ch, (y * w + x - 1) * ch)) {
        xs.push(x)
        break
      }
    }
  }
  const ys = []
  for (let y = 1; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!samePixel(data, ch, (y * w + x) * ch, ((y - 1) * w + x) * ch)) {
        ys.push(y)
        break
      }
    }
  }
  return [xs, ys]
}

/**
 * Cell start offsets, or null when this is not upscaled pixel art.
 *
 * Requires an evenly spaced grid: every interior cell the same size, with the
 * first and last allowed to be short. Figma's exports are often offset by a
 * pixel -- the group mascots are a 50x grid whose boundaries land at 51, 101,
 * 151 ... -- so keying purely off multiples of the origin misses them. Demanding
 * even spacing is what stops this from mangling ordinary artwork, where
 * collapsing a wide flat region to a single pixel would distort the geometry.
 */
function detectGrid(data, w, h, ch) {
  const [bx, by] = boundaries(data, w, h, ch)

  // Cell size is the gcd of the gaps between colour changes, not the gaps
  // themselves: two adjacent blocks of the same colour produce no boundary, so
  // a run of identical blocks shows up as one wide gap. The phase is whatever
  // offset the boundaries share -- Figma exports the mascots on a 50px grid
  // whose boundaries land at 51, 101, 151 ...
  const gcd = (a, b) => (b ? gcd(b, a % b) : a)

  // Period of one axis, or 0 when it has too few colour changes to tell (a
  // mouth overlay is mostly transparent and may only change twice). gcd(0, n)
  // is n, so an uninformative axis simply defers to the other one.
  const period = (bounds) => {
    let g = 0
    for (let i = 1; i < bounds.length; i++) g = gcd(g, bounds[i] - bounds[i - 1])
    return g
  }

  const gx = gcd(period(bx), period(by))
  if (gx < 2) return null

  const build = (bounds, len) => {
    const phase = bounds.length ? bounds[0] % gx : 0
    const starts = phase > 0 ? [0] : []
    for (let v = phase; v < len; v += gx) starts.push(v)
    // Every colour change must sit exactly on a cell edge.
    const edges = new Set(starts)
    return bounds.some((b) => !edges.has(b)) ? null : starts
  }

  const xs = build(bx, w)
  const ys = build(by, h)
  if (!xs || !ys) return null
  if (xs.length < MIN_SIDE || ys.length < MIN_SIDE) return null
  if (xs.length >= w || ys.length >= h) return null

  // Every cell must be one flat colour.
  for (let j = 0; j < ys.length; j++) {
    const y1 = j + 1 < ys.length ? ys[j + 1] : h
    for (let i = 0; i < xs.length; i++) {
      const x1 = i + 1 < xs.length ? xs[i + 1] : w
      const base = (ys[j] * w + xs[i]) * ch
      for (let y = ys[j]; y < y1; y++) {
        for (let x = xs[i]; x < x1; x++) {
          if (!samePixel(data, ch, (y * w + x) * ch, base)) return null
        }
      }
    }
  }
  return { xs, ys, g: gx }
}

/** One pixel per cell, sampled at the cell's origin. */
function shrink(data, w, ch, xs, ys) {
  const out = Buffer.alloc(xs.length * ys.length * ch)
  for (let j = 0; j < ys.length; j++) {
    for (let i = 0; i < xs.length; i++) {
      const src = (ys[j] * w + xs[i]) * ch
      data.copy(out, (j * xs.length + i) * ch, src, src + ch)
    }
  }
  return out
}

/** Repaint the original cell geometry from the small buffer, for verification. */
function grow(small, w, h, ch, xs, ys) {
  const out = Buffer.alloc(w * h * ch)
  for (let j = 0; j < ys.length; j++) {
    const y1 = j + 1 < ys.length ? ys[j + 1] : h
    for (let i = 0; i < xs.length; i++) {
      const x1 = i + 1 < xs.length ? xs[i + 1] : w
      const src = (j * xs.length + i) * ch
      for (let y = ys[j]; y < y1; y++) {
        for (let x = xs[i]; x < x1; x++) {
          small.copy(out, (y * w + x) * ch, src, src + ch)
        }
      }
    }
  }
  return out
}

/**
 * Downscale one PNG buffer. Returns { png, from, to, g } or null when the image
 * is not upscaled pixel art (or when verification fails).
 */
async function downscalePng(buf, label) {
  const { data, info } = await sharp(buf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const { width: w, height: h, channels: ch } = info

  const grid = detectGrid(data, w, h, ch)
  if (!grid) return null

  const { xs, ys, g } = grid
  const nw = xs.length
  const nh = ys.length
  const small = shrink(data, w, ch, xs, ys)

  // Try palette first (much smaller for flat pixel art); fall back to full
  // colour if quantisation would change a single byte.
  for (const opts of [{ palette: true, effort: 10 }, { compressionLevel: 9 }]) {
    const png = await sharp(small, { raw: { width: nw, height: nh, channels: ch } })
      .png(opts)
      .toBuffer()

    const check = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    if (check.info.width !== nw || check.info.height !== nh) continue
    if (!grow(check.data, w, h, ch, xs, ys).equals(data)) continue

    return { png, from: `${w}x${h}`, to: `${nw}x${nh}`, g }
  }

  console.warn(`  !! ${label}: verification failed at g=${g}, left untouched`)
  return null
}

// --- PNG files -------------------------------------------------------------

const files = walk(ROOT)
const pngs = files.filter((f) => extname(f).toLowerCase() === '.png')

let before = 0
let after = 0
let changed = 0
let skipped = 0

for (const file of pngs) {
  const buf = readFileSync(file)
  before += buf.length

  const result = await downscalePng(buf, file)
  if (!result || result.png.length >= buf.length) {
    after += buf.length
    skipped++
    continue
  }

  if (!DRY) writeFileSync(file, result.png)
  after += result.png.length
  changed++
  console.log(
    `  ${file}  ${result.from} -> ${result.to} (/${result.g})  ` +
      `${(buf.length / 1024).toFixed(1)}KB -> ${(result.png.length / 1024).toFixed(1)}KB`,
  )
}

// --- SVGs wrapping a base64 PNG -------------------------------------------
//
// Figma exported several icons as an <svg> whose only content is a <pattern>
// <use>-ing a base64 <image>. The raster inside is the same upscaled pixel art,
// and base64 adds a further ~33%. Shrinking the raster means the <image>'s
// width/height attributes shrink too, so the <use> transform that maps image
// space into the pattern box has to grow by the same factor or the icon would
// render at 1/g of its size.

function scaleTransform(transform, g) {
  return transform
    .replace(/matrix\(([^)]*)\)/, (_, args) => {
      const n = args.trim().split(/[\s,]+/).map(Number)
      if (n.length !== 6 || n.some(Number.isNaN)) return _
      // Linear part (a b c d) maps image pixels; translation (e f) is already
      // in target space and must not move.
      const scaled = [n[0] * g, n[1] * g, n[2] * g, n[3] * g, n[4], n[5]]
      return `matrix(${scaled.map((v) => +v.toPrecision(12)).join(' ')})`
    })
    .replace(/scale\(([^)]*)\)/, (_, args) => {
      const n = args.trim().split(/[\s,]+/).map(Number)
      if (!n.length || n.some(Number.isNaN)) return _
      return `scale(${n.map((v) => +(v * g).toPrecision(12)).join(' ')})`
    })
}

const svgs = files.filter((f) => extname(f).toLowerCase() === '.svg')

for (const file of svgs) {
  let svg = readFileSync(file, 'utf8')
  const originalSize = Buffer.byteLength(svg)
  before += originalSize

  const imageTag = svg.match(
    /<image\b[^>]*\bid="([^"]+)"[^>]*\bwidth="(\d+)"[^>]*\bheight="(\d+)"[^>]*data:image\/png;base64,([A-Za-z0-9+/=]+)"[^>]*\/>/,
  )
  if (!imageTag) {
    after += originalSize
    skipped++
    continue
  }

  const [tag, id, , , b64] = imageTag
  const result = await downscalePng(Buffer.from(b64, 'base64'), file)
  if (!result) {
    after += originalSize
    skipped++
    continue
  }

  const [nw, nh] = result.to.split('x')
  let newTag = tag
    .replace(/\bwidth="\d+"/, `width="${nw}"`)
    .replace(/\bheight="\d+"/, `height="${nh}"`)
    .replace(/data:image\/png;base64,[A-Za-z0-9+/=]+/, `data:image/png;base64,${result.png.toString('base64')}`)

  // The page-level `* { image-rendering: pixelated }` in app/globals.css styles
  // the <img> that loads this file; it does not reach inside the SVG document,
  // where scaling the embedded raster still defaults to smooth. That went
  // unnoticed while the raster was 1600px (always downscaled into its box), but
  // at native size some of these icons are drawn *up* -- map.svg puts a 32x35
  // raster in an 83x69 box -- and would render soft. Set it on the element.
  if (!/\bimage-rendering=/.test(newTag)) {
    newTag = newTag.replace(/<image\b/, '<image image-rendering="pixelated"')
  }

  let patched = svg.replace(tag, newTag)

  // Grow the <use transform> that references this image by the same factor.
  const useRe = new RegExp(`(<use\\b[^>]*xlink:href="#${id}"[^>]*transform=")([^"]+)(")`)
  if (!useRe.test(patched)) {
    console.warn(`  !! ${file}: no <use transform> for #${id}, left untouched`)
    after += originalSize
    skipped++
    continue
  }
  patched = patched.replace(useRe, (_, pre, t, post) => pre + scaleTransform(t, result.g) + post)

  if (!DRY) writeFileSync(file, patched)
  const newSize = Buffer.byteLength(patched)
  after += newSize
  changed++
  console.log(
    `  ${file}  raster ${result.from} -> ${result.to} (/${result.g})  ` +
      `${(originalSize / 1024).toFixed(1)}KB -> ${(newSize / 1024).toFixed(1)}KB`,
  )
}

console.log(
  `\n${DRY ? '[dry run] ' : ''}${changed} rewritten, ${skipped} left alone.\n` +
    `${(before / 1024 / 1024).toFixed(2)}MB -> ${(after / 1024 / 1024).toFixed(2)}MB ` +
    `(saved ${(((before - after) / before) * 100).toFixed(1)}%)`,
)
