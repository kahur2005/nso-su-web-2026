import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'

/** Hash password using scrypt with random salt. Format: salt:hash. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

/** Verify password against stored salt:hash string. */
export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const hashed = Buffer.from(hash, 'hex')
  const candidate = scryptSync(password, salt, 64)
  return timingSafeEqual(hashed, candidate)
}
