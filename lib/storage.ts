import { supabase } from '@/lib/supabase'

// Uploads an image to a public Storage bucket (created on first use) and returns
// its public URL, or null when no usable file is given / the upload fails.
export async function uploadImage(
  bucket: string,
  file: File | null
): Promise<string | null> {
  if (!file || file.size === 0) return null

  // Idempotent: create the public bucket if it doesn't exist yet.
  await supabase.storage.createBucket(bucket, { public: true })

  const ext = (file.name.split('.').pop() || 'png').toLowerCase()
  const path = `${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType: file.type || 'image/png', upsert: false })

  if (error) {
    console.error(`Upload to ${bucket} failed:`, error)
    return null
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}
