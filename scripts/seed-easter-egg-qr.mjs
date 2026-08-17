#!/usr/bin/env node
/**
 * Seed Quest.qrCode for "Find an Easter Egg in the Website!" from the local PNG.
 *
 * Usage (from repo root, with .env loaded):
 *   node --env-file=.env scripts/seed-easter-egg-qr.mjs
 *
 * After a successful run, delete public/images/qr-find-an-easter-egg-in-the-website!.png
 * so the asset is only in the DB (Quest.qrCode data-URL).
 *
 * If the PNG is already gone, re-export Quest.qrCode from the Table Editor or
 * put the file back at that path before re-running.
 */
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const TITLE = 'Find an Easter Egg in the Website!'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pngPath = path.join(
  __dirname,
  '..',
  'public',
  'images',
  'qr-find-an-easter-egg-in-the-website!.png'
)

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

if (!fs.existsSync(pngPath)) {
  console.error('PNG not found at', pngPath)
  process.exit(1)
}

const buf = fs.readFileSync(pngPath)
const dataUrl = `data:image/png;base64,${buf.toString('base64')}`
const supabase = createClient(url, key)

const { data: quest, error: findError } = await supabase
  .from('Quest')
  .select('id, title, qrCode')
  .eq('title', TITLE)
  .eq('isDeleted', false)
  .maybeSingle()

if (findError) {
  console.error('Quest lookup failed:', findError)
  process.exit(1)
}
if (!quest) {
  console.error(`No active Quest titled "${TITLE}". Create it in /admin/quests first.`)
  process.exit(1)
}

const { error: updateError } = await supabase
  .from('Quest')
  .update({ qrCode: dataUrl })
  .eq('id', quest.id)

if (updateError) {
  console.error('Update failed:', updateError)
  process.exit(1)
}

console.log(`Updated Quest ${quest.id} ("${TITLE}") qrCode (${buf.length} bytes PNG → data-URL).`)
console.log('You can now delete public/images/qr-find-an-easter-egg-in-the-website!.png')
