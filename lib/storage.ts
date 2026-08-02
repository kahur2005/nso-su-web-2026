import sharp from 'sharp'
import { supabase } from '@/lib/supabase'

// Every uploaded image in the app goes through uploadImage(), so this is the one
// place that decides how large stored art is allowed to be.
//
// Why this exists: admins upload straight off a phone. Before the resize step the
// `committee-photos` bucket held 50 files averaging 3.2MB (157MB total), and
// /info/committee renders three of them per page into a card ~150px wide — so the
// page was shipping roughly 45x more pixels than any device could display, and a
// first pass through all six divisions cost ~130MB.
//
// Policy is per-bucket because the right ceiling depends on how the image is read,
// not on how it was uploaded. Use 'passthrough' for a bucket whose bytes must
// survive untouched — notably pixel art, which resampling destroys. Nothing needs
// that today (all pixel art lives in public/images/ and is handled by
// scripts/downscale-pixel-art.mjs), but a badge bucket plausibly would.
type ImagePolicy = { maxEdge: number; quality: number } | 'passthrough'

export const BUCKET_POLICY: Record<string, ImagePolicy> = {
  'committee-photos': { maxEdge: 640, quality: 80 },  // rendered ~150px in a card
  'club-icons': { maxEdge: 256, quality: 80 },
  'club-images': { maxEdge: 1024, quality: 80 },      // carousel, viewed larger
  'lunch-restaurants': { maxEdge: 800, quality: 80 },
  'lunch-items': { maxEdge: 800, quality: 80 },
  // Committee staff verify the paid amount by eye, so this one keeps enough
  // resolution to read a QRIS receipt. Over-compressing here costs real money.
  'lunch-proofs': { maxEdge: 1600, quality: 85 },
}

const DEFAULT_POLICY: ImagePolicy = { maxEdge: 1024, quality: 80 }

// Object names are random UUIDs and are never rewritten in place by the app, so a
// stored URL is a permanent identity and can be cached indefinitely. A new
// committee photo gets a new UUID, so genuinely new content is still fetched.
const CACHE_CONTROL = '31536000' // 1 year, in seconds (supabase-js wants a string)

/**
 * Resizes to fit inside maxEdge and re-encodes as WebP. Returns null if sharp
 * can't handle the input (e.g. iPhone HEIC without libheif), leaving the caller
 * to fall back to the original bytes.
 */
async function shrink(
  buf: Buffer,
  policy: { maxEdge: number; quality: number }
): Promise<Buffer | null> {
  try {
    return await sharp(buf)
      // Bare .rotate() applies the EXIF orientation tag before metadata is
      // dropped. Without it every portrait phone photo comes out sideways.
      .rotate()
      .resize(policy.maxEdge, policy.maxEdge, {
        fit: 'inside',
        withoutEnlargement: true, // never upscale something already small
      })
      .webp({ quality: policy.quality })
      .toBuffer()
  } catch (err) {
    console.error('Image resize failed, falling back to the original:', err)
    return null
  }
}

// Uploads an image to a public Storage bucket (created on first use) and returns
// its public URL, or null when no usable file is given / the upload fails.
export async function uploadImage(
  bucket: string,
  file: File | null
): Promise<string | null> {
  if (!file || file.size === 0) return null

  // Idempotent: create the public bucket if it doesn't exist yet.
  await supabase.storage.createBucket(bucket, { public: true })

  const original = Buffer.from(await file.arrayBuffer())
  const policy = BUCKET_POLICY[bucket] ?? DEFAULT_POLICY

  // A resize failure must never lose the admin's photo — uploading something big
  // beats silently dropping it, and every call site already tolerates null.
  const resized = policy === 'passthrough' ? null : await shrink(original, policy)

  const body = resized ?? original
  const ext = resized ? 'webp' : (file.name.split('.').pop() || 'png').toLowerCase()
  const contentType = resized ? 'image/webp' : file.type || 'image/png'
  const path = `${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, body, { contentType, upsert: false, cacheControl: CACHE_CONTROL })

  if (error) {
    console.error(`Upload to ${bucket} failed:`, error)
    return null
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}
