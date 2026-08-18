/** Calculate CRC-16/CCITT checksum for tag 63. Return 4 uppercase hex characters. */
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

/** Remove line breaks and tabs from raw payload string. */
export function normalizeQrisPayload(raw: string): string {
  return raw.replace(/[\r\n\t]/g, '').trim()
}

/** Validate checksum of QRIS payload string. */
export function isValidQrisPayload(payload: string): boolean {
  const source = payload.trim()
  if (source.length < 8) return false
  return convertCRC16(source.slice(0, -4)) === source.slice(-4).toUpperCase()
}

/** Generate a dynamic QRIS payload for the specified transaction amount. */
export function buildDynamicQris(staticPayload: string, amount: number): string {
  const source = staticPayload.trim()

  if (!source) {
    throw new Error('QRIS static payload is not configured.')
  }
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error(`QRIS amount must be a positive whole number, got ${amount}.`)
  }

  // Split at country code tag (5802ID).
  if (source.split('5802ID').length !== 2) {
    throw new Error(
      'QRIS static payload is malformed: expected exactly one "5802ID" country-code tag.'
    )
  }

  if (!isValidQrisPayload(source)) {
    throw new Error(
      'QRIS static payload fails its own checksum — it was altered after the bank issued it. Re-paste it exactly as given.'
    )
  }

  // Remove existing CRC hex value and set dynamic point of initiation.
  let qris = source.slice(0, -4)
  qris = qris.replace('010211', '010212')

  const digits = String(amount)
  const amountTag = '54' + String(digits.length).padStart(2, '0') + digits + '5802ID'

  const [head, tail] = qris.split('5802ID')
  const withAmount = head + amountTag + tail

  return withAmount + convertCRC16(withAmount)
}
