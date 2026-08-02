// Shrinks the images already sitting in Supabase Storage to match the per-bucket
// policy that lib/storage.ts now applies to new uploads.
//
// Background: uploadImage() used to store the admin's file verbatim, so
// `committee-photos` accumulated 50 phone photos averaging 3.2MB (157MB total)
// that /info/committee renders into a ~150px card. This script re-encodes them.
//
// Two deliberate choices:
//
//   1. Each object is rewritten AT THE SAME PATH. That path is embedded in
//      NPC.avatarUrl / Club.iconUrl / LunchMenuItem.imageUrl for 47+ rows, so
//      reusing it means zero production DB writes and no broken links. The cost
//      is cosmetic: a URL still ending in .png while the bytes are WebP. Browsers
//      dispatch on the Content-Type header, not the extension, so this is fine.
//
//   2. Every original is downloaded to .backup/<bucket>/ BEFORE anything is
//      overwritten. These are one-time event photos; an in-place rewrite is not
//      reversible otherwise.
//
// Usage:
//   node scripts/shrink-storage-images.mjs --dry-run
//   node scripts/shrink-storage-images.mjs
//   node scripts/shrink-storage-images.mjs --bucket=committee-photos
//
// Safe to re-run: anything already WebP or already under SKIP_UNDER_BYTES is left
// alone, so a second pass reports every file as skipped.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

// Mirrors BUCKET_POLICY in lib/storage.ts -- keep the two in step.
const BUCKET_POLICY = {
  'committee-photos': { maxEdge: 640, quality: 80 },
  'club-icons': { maxEdge: 256, quality: 80 },
  'club-images': { maxEdge: 1024, quality: 80 },
  'lunch-restaurants': { maxEdge: 800, quality: 80 },
  'lunch-items': { maxEdge: 800, quality: 80 },
  'lunch-proofs': { maxEdge: 1600, quality: 85 },
}

const CACHE_CONTROL = '31536000'
const SKIP_UNDER_BYTES = 150 * 1024
const BACKUP_DIR = '.backup'

const args = process.argv.slice(2)
const DRY = args.includes('--dry-run')
const onlyBucket = args.find((a) => a.startsWith('--bucket='))?.split('=')[1]

// .env isn't loaded for us in a bare node script; parse the two keys we need.
function loadEnv() {
  const env = {}
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\r\n]*)"?/)
    if (m) env[m[1]] = m[2]
  }
  return env
}

const env = loadEnv()
if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env')
}
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const fmt = (b) => (b / 1048576).toFixed(2) + 'MB'

let totalBefore = 0
let totalAfter = 0
let rewritten = 0
let skipped = 0
let failed = 0

for (const [bucket, policy] of Object.entries(BUCKET_POLICY)) {
  if (onlyBucket && bucket !== onlyBucket) continue

  const { data: list, error: listError } = await supabase.storage
    .from(bucket)
    .list('', { limit: 1000 })

  if (listError) {
    console.error(`\n${bucket}: list failed -- ${listError.message}`)
    continue
  }

  const files = (list ?? []).filter((f) => f.metadata?.size)
  if (files.length === 0) {
    console.log(`\n${bucket}: empty, nothing to do`)
    continue
  }

  console.log(`\n=== ${bucket} (${files.length} files) ===`)
  const rows = []

  for (const file of files) {
    const size = file.metadata.size
    const mime = file.metadata.mimetype || ''
    totalBefore += size

    if (mime === 'image/webp' || size < SKIP_UNDER_BYTES) {
      totalAfter += size
      skipped++
      rows.push({ file: file.name.slice(0, 12), before: fmt(size), after: '-', result: 'skipped' })
      continue
    }

    const { data: blob, error: dlError } = await supabase.storage.from(bucket).download(file.name)
    if (dlError || !blob) {
      totalAfter += size
      failed++
      rows.push({ file: file.name.slice(0, 12), before: fmt(size), after: '-', result: 'download failed' })
      continue
    }
    const original = Buffer.from(await blob.arrayBuffer())

    // Back up before the first byte is overwritten, dry run or not -- a dry run
    // that leaves you with a backup costs nothing.
    const backupDir = join(BACKUP_DIR, bucket)
    mkdirSync(backupDir, { recursive: true })
    const backupPath = join(backupDir, file.name)
    if (!existsSync(backupPath)) writeFileSync(backupPath, original)

    let shrunk
    try {
      shrunk = await sharp(original)
        .rotate() // apply EXIF orientation before metadata is dropped
        .resize(policy.maxEdge, policy.maxEdge, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: policy.quality })
        .toBuffer()
    } catch (err) {
      totalAfter += size
      failed++
      rows.push({ file: file.name.slice(0, 12), before: fmt(size), after: '-', result: `encode failed: ${err.message}` })
      continue
    }

    // Guard against the pathological case where WebP comes out larger.
    if (shrunk.length >= size) {
      totalAfter += size
      skipped++
      rows.push({ file: file.name.slice(0, 12), before: fmt(size), after: fmt(shrunk.length), result: 'skipped (no gain)' })
      continue
    }

    if (DRY) {
      totalAfter += shrunk.length
      rewritten++
      rows.push({ file: file.name.slice(0, 12), before: fmt(size), after: fmt(shrunk.length), result: 'would rewrite' })
      continue
    }

    const { error: upError } = await supabase.storage.from(bucket).upload(file.name, shrunk, {
      contentType: 'image/webp',
      cacheControl: CACHE_CONTROL,
      upsert: true, // same path on purpose: keeps every stored URL valid
    })

    if (upError) {
      totalAfter += size
      failed++
      rows.push({ file: file.name.slice(0, 12), before: fmt(size), after: '-', result: `upload failed: ${upError.message}` })
      continue
    }

    totalAfter += shrunk.length
    rewritten++
    rows.push({ file: file.name.slice(0, 12), before: fmt(size), after: fmt(shrunk.length), result: 'rewritten' })
  }

  console.table(rows)
}

console.log(
  `\n${DRY ? '[dry run] ' : ''}${rewritten} rewritten, ${skipped} skipped, ${failed} failed.\n` +
    `Total ${fmt(totalBefore)} -> ${fmt(totalAfter)} ` +
    `(${totalBefore ? (100 - (totalAfter / totalBefore) * 100).toFixed(1) : 0}% smaller)\n` +
    (DRY ? 'Nothing was written. Re-run without --dry-run to apply.\n' : `Originals backed up under ${BACKUP_DIR}/\n`) +
    'Note: the Supabase CDN may serve the previous object for up to an hour ' +
    '(the old max-age=3600), so verify with a cache-busting query string.\n'
)
