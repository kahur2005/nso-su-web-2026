// Extracts the 15 group logos embedded in public/images/group/group-logo.svg.
//
// The file is not vector art: it is 15 <rect>s filled with <pattern>s, each of
// which <use>s an <image> holding a base64 PNG. Critically the <rect>s are NOT
// in visual order -- the 12th rect in the file sits 4th from the top. We sort by
// effective Y so the strip reads top-to-bottom, which is the order the names
// were supplied in.
//
// Usage: node scripts/extract-group-logos.mjs
// Safe to re-run; overwrites its own output.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const SVG = 'public/images/group/group-logo.svg'
const OUT = 'public/images/group'

// Top-to-bottom order of the strip, as supplied by the design owner.
const NAMES = [
  'Siren', 'Unicorn', 'Griffin', 'Sphinx', 'Wyvern',
  'Faerie', 'Nymph', 'Minotaur', 'Pegasus', 'Kraken',
  'Kitsune', 'Phoenix', 'Harpy', 'Chimera', 'Fenrir',
]

const svg = readFileSync(SVG, 'utf8')

// 1. Collect rects with their effective Y. Two forms appear:
//    y="390", and transform="matrix(-1 0 0 1 57 781)" where Y is component 6.
const rects = []
for (const m of svg.matchAll(/<rect\b([^>]*)\/>/g)) {
  const attrs = m[1]
  const fill = /fill="url\(#(pattern\d+_[\d_]+)\)"/.exec(attrs)
  if (!fill) continue

  const yAttr = /\by="([\d.]+)"/.exec(attrs)
  const matrix = /transform="matrix\(([^)]+)\)"/.exec(attrs)
  let y = yAttr ? parseFloat(yAttr[1]) : 0
  if (matrix) {
    const parts = matrix[1].trim().split(/[\s,]+/).map(Number)
    y = parts[5] // f component of matrix(a b c d e f)
  }
  rects.push({ patternId: fill[1], y })
}

if (rects.length !== NAMES.length) {
  throw new Error(`Expected ${NAMES.length} rects, found ${rects.length}`)
}

rects.sort((a, b) => a.y - b.y)

// 2. pattern id -> image id
const patternToImage = new Map()
for (const m of svg.matchAll(
  /<pattern id="(pattern\d+_[\d_]+)"[^>]*>\s*<use xlink:href="#(image\d+_[\d_]+)"/g
)) {
  patternToImage.set(m[1], m[2])
}

// 3. image id -> base64 payload
const imageToData = new Map()
for (const m of svg.matchAll(
  /<image id="(image\d+_[\d_]+)"[^>]*xlink:href="data:image\/png;base64,([^"]+)"/g
)) {
  imageToData.set(m[1], m[2])
}

mkdirSync(OUT, { recursive: true })

const manifest = []
rects.forEach((rect, i) => {
  const name = NAMES[i]
  const imageId = patternToImage.get(rect.patternId)
  if (!imageId) throw new Error(`No image for ${rect.patternId}`)
  const b64 = imageToData.get(imageId)
  if (!b64) throw new Error(`No data for ${imageId}`)

  const slug = name.toLowerCase()
  const buf = Buffer.from(b64, 'base64')
  writeFileSync(join(OUT, `${slug}.png`), buf)
  manifest.push({ name, slug, y: rect.y, pattern: rect.patternId, bytes: buf.length })
})

console.table(manifest)
console.log(`Wrote ${manifest.length} logos to ${OUT}/`)
