// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// Server-only Supabase client.
// All database access in this app happens on the server (server components,
// route handlers, server actions) and we authenticate users ourselves via
// next-auth — so we use the SERVICE ROLE key, which bypasses Row Level
// Security. NEVER import this from a client component or expose the key.
const supabaseUrl = process.env.SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.'
  )
}

export const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})
