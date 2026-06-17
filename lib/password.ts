// lib/password.ts
//
// Password hashing for manual email/password auth. Uses Node's built-in
// scrypt so there is no native dependency to build (works on Vercel as-is).
// Stored format: "<salt-hex>:<hash-hex>".
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const hashed = Buffer.from(hash, 'hex')
  const candidate = scryptSync(password, salt, 64)
  // Both are 64 bytes, so timingSafeEqual won't throw on a length mismatch.
  return timingSafeEqual(hashed, candidate)
}
