// lib/qris.ts
// Turns a merchant's STATIC QRIS payload into a DYNAMIC one carrying a fixed
// amount, so a student's phone shows the exact total instead of asking them to
// type it.
//
// Ported from the reference implementation kept at
// REFERENCE/qris-generator.tsx.txt. That file is a .txt on purpose: it imports
// shadcn components this project does not have, so leaving it as .tsx anywhere
// under the project root fails `next build`'s type check.
//
// A QRIS payload is EMVCo TLV: repeated `<2-digit tag><2-digit length><value>`,
// ending with tag 63 (the CRC). Turning static into dynamic means three edits:
//
//   1. tag 01 "point of initiation": 11 (static, reusable) -> 12 (dynamic, one
//      amount, one transaction)
//   2. insert tag 54 "transaction amount" just before tag 58 "country code"
//      (which is always `5802ID` for Indonesia — that literal is what we split
//      on, since it is the anchor every Indonesian payload shares)
//   3. recompute tag 63's CRC over everything preceding it
//
// No React, no Node built-ins: safe to import from both server and client.

/**
 * CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF, no reflection, no final XOR) —
 * the checksum EMVCo specifies for tag 63. Returns 4 uppercase hex digits.
 */
export function convertCRC16(data: string): string {
  let crc = 0xffff
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021
      } else {
        crc <<= 1
      }
      crc &= 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

/**
 * Cleans a payload pasted into an admin field.
 *
 * Removes ONLY line breaks and tabs, which a wrapped paste can introduce and
 * which never appear in a real payload. Ordinary spaces are left alone: they
 * are legitimate inside the merchant-name (tag 59) and city (tag 60) fields,
 * and stripping them desynchronises every length prefix that follows.
 *
 * (This is not hypothetical — an earlier version of the admin action stripped
 * all whitespace and silently corrupted a live merchant payload whose name was
 * "EMBUN KAHURIPAN, Digital".)
 */
export function normalizeQrisPayload(raw: string): string {
  return raw.replace(/[\r\n\t]/g, '').trim()
}

/**
 * True when the payload's trailing CRC matches its own contents — i.e. it is
 * byte-for-byte what the bank issued.
 *
 * This is the cheap integrity check worth running on anything pasted in by
 * hand, because a payload mangled in transit still *looks* fine.
 */
export function isValidQrisPayload(payload: string): boolean {
  const source = payload.trim()
  if (source.length < 8) return false
  return convertCRC16(source.slice(0, -4)) === source.slice(-4).toUpperCase()
}

/**
 * Builds a dynamic QRIS payload for `amount` rupiah from a static one.
 *
 * Throws rather than returning something malformed: a bad payload produces a
 * QR code that looks perfectly fine and only fails inside the student's banking
 * app, at the counter, which is the worst possible place to discover it.
 *
 * @param staticPayload the merchant's static QRIS string (the long `00020101...`)
 * @param amount        whole rupiah, > 0
 */
export function buildDynamicQris(staticPayload: string, amount: number): string {
  const source = staticPayload.trim()

  if (!source) {
    throw new Error('QRIS static payload is not configured.')
  }
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error(`QRIS amount must be a positive whole number, got ${amount}.`)
  }
  // Split on the country-code tag, which is the insertion anchor. Exactly one
  // occurrence is expected; zero means this is not an Indonesian QRIS payload,
  // and more than one means we cannot tell where the amount belongs.
  if (source.split('5802ID').length !== 2) {
    throw new Error(
      'QRIS static payload is malformed: expected exactly one "5802ID" country-code tag.'
    )
  }
  // Refuse to build on a base that is already damaged. Without this the CRC we
  // append is a valid checksum over corrupt contents — the resulting QR scans
  // cleanly and then fails in the banking app, which is the worst outcome.
  if (!isValidQrisPayload(source)) {
    throw new Error(
      'QRIS static payload fails its own checksum — it was altered after the bank issued it. Re-paste it exactly as given.'
    )
  }

  // Drop the trailing CRC (tag 63 is always the last 8 chars: "6304" + 4 hex);
  // slice(0, -4) removes only the 4 hex digits, leaving "6304" in place to be
  // followed by the recomputed value, exactly as the reference does.
  let qris = source.slice(0, -4)

  // Static -> dynamic point of initiation.
  qris = qris.replace('010211', '010212')

  const digits = String(amount)
  const amountTag = '54' + String(digits.length).padStart(2, '0') + digits + '5802ID'

  const [head, tail] = qris.split('5802ID')
  const withAmount = head + amountTag + tail

  return withAmount + convertCRC16(withAmount)
}
