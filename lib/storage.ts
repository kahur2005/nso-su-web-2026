import { supabase } from '@/lib/supabase'

type ImagePolicy = { maxEdge: number; quality: number } | 'passthrough'

export const BUCKET_POLICY: Record<string, ImagePolicy> = {
  'committee-photos': { maxEdge: 640, quality: 80 },
  'club-icons': { maxEdge: 256, quality: 80 },
  'club-images': { maxEdge: 1024, quality: 80 },
  'lunch-restaurants': { maxEdge: 800, quality: 80 },
  'lunch-items': { maxEdge: 800, quality: 80 },
  'lunch-proofs': { maxEdge: 1600, quality: 85 },
  'quest-submissions': { maxEdge: 1600, quality: 85 },
}

const DEFAULT_POLICY: ImagePolicy = { maxEdge: 1024, quality: 80 }

const CACHE_CONTROL = '31536000'

/** Resize image to fit maxEdge and encode as WebP. Return null on failure. */
async function shrink(
  buf: Buffer,
  policy: { maxEdge: number; quality: number }
): Promise<Buffer | null> {
  try {
    // @ts-ignore
    const sharpModule = await import(/* webpackIgnore: true */ 'sharp').catch(() => null)
    if (!sharpModule) return null
    const sharp = sharpModule.default || sharpModule
    return await sharp(buf)
      .rotate()
      .resize(policy.maxEdge, policy.maxEdge, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: policy.quality })
      .toBuffer()
  } catch (err) {
    console.error('Image resize failed, falling back to the original:', err)
    return null
  }
}

export async function uploadImage(
  bucket: string,
  file: File | null
): Promise<string | null> {
  if (!file || file.size === 0) return null

  await supabase.storage.createBucket(bucket, { public: true })

  const original = Buffer.from(await file.arrayBuffer())
  const policy = BUCKET_POLICY[bucket] ?? DEFAULT_POLICY

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

const QUEST_FILE_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
])

export const QUEST_FILE_MAX_BYTES = 10 * 1024 * 1024

/** Upload quest submission file to Supabase storage. */
export async function uploadQuestFile(
  file: File,
): Promise<{ url: string; fileName: string; mimeType: string } | null> {
  if (!file || file.size === 0) return null
  if (file.size > QUEST_FILE_MAX_BYTES) return null
  const mime = file.type || 'application/octet-stream'
  if (!QUEST_FILE_MIME.has(mime)) return null

  const bucket = 'quest-submissions'
  await supabase.storage.createBucket(bucket, { public: true })

  const original = Buffer.from(await file.arrayBuffer())
  const isPdf = mime === 'application/pdf'
  const policy = BUCKET_POLICY[bucket] ?? DEFAULT_POLICY
  const resized =
    isPdf || policy === 'passthrough'
      ? null
      : await shrink(original, policy as { maxEdge: number; quality: number })

  const body = resized ?? original
  const ext = isPdf
    ? 'pdf'
    : resized
      ? 'webp'
      : (file.name.split('.').pop() || 'png').toLowerCase()
  const contentType = isPdf ? 'application/pdf' : resized ? 'image/webp' : mime
  const path = `${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, body, { contentType, upsert: false, cacheControl: CACHE_CONTROL })
  if (error) {
    console.error(`Upload to ${bucket} failed:`, error)
    return null
  }
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return { url: data.publicUrl, fileName: file.name, mimeType: contentType }
}
