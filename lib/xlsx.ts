// lib/xlsx.ts
// A minimal .xlsx writer. SERVER ONLY — uses node:zlib.
//
// Why hand-rolled rather than a library: an .xlsx is a ZIP containing a handful
// of XML parts, and Node already ships the only hard part (DEFLATE). The two
// obvious dependencies both cost more than they save here — the `xlsx` package
// on npm is frozen at 0.18.5 with open advisories, and `exceljs` is about a
// megabyte to serve one admin download button.
//
// Scope is deliberately small: one sheet, strings and numbers, an optional bold
// header row. No formulas, dates, merges or styling beyond bold. If this ever
// needs more than that, reach for a real library instead of growing this file.

import { deflateRawSync } from 'node:zlib'

export type CellValue = string | number | null | undefined

// ----------------------------------------------------------------- zip ----

const CRC_TABLE = (() => {
  const table = new Int32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[i] = c
  }
  return table
})()

function crc32(buf: Buffer): number {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

interface ZipEntry {
  name: string
  data: Buffer
}

/** Builds a ZIP archive with every entry DEFLATE-compressed. */
function zip(entries: ZipEntry[]): Buffer {
  const locals: Buffer[] = []
  const centrals: Buffer[] = []
  let offset = 0

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name, 'utf8')
    const compressed = deflateRawSync(entry.data)
    const crc = crc32(entry.data)

    const local = Buffer.alloc(30 + nameBuf.length)
    local.writeUInt32LE(0x04034b50, 0) // local file header signature
    local.writeUInt16LE(20, 4) // version needed
    local.writeUInt16LE(0, 6) // flags
    local.writeUInt16LE(8, 8) // method: deflate
    local.writeUInt16LE(0, 10) // mod time
    local.writeUInt16LE(0x21, 12) // mod date (1980-01-01; Excel does not care)
    local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(compressed.length, 18)
    local.writeUInt32LE(entry.data.length, 22)
    local.writeUInt16LE(nameBuf.length, 26)
    local.writeUInt16LE(0, 28) // extra length
    nameBuf.copy(local, 30)

    const central = Buffer.alloc(46 + nameBuf.length)
    central.writeUInt32LE(0x02014b50, 0) // central directory signature
    central.writeUInt16LE(20, 4) // version made by
    central.writeUInt16LE(20, 6) // version needed
    central.writeUInt16LE(0, 8)
    central.writeUInt16LE(8, 10)
    central.writeUInt16LE(0, 12)
    central.writeUInt16LE(0x21, 14)
    central.writeUInt32LE(crc, 16)
    central.writeUInt32LE(compressed.length, 20)
    central.writeUInt32LE(entry.data.length, 24)
    central.writeUInt16LE(nameBuf.length, 28)
    central.writeUInt16LE(0, 30) // extra
    central.writeUInt16LE(0, 32) // comment
    central.writeUInt16LE(0, 34) // disk number
    central.writeUInt16LE(0, 36) // internal attrs
    central.writeUInt32LE(0, 38) // external attrs
    central.writeUInt32LE(offset, 42) // local header offset
    nameBuf.copy(central, 46)

    locals.push(local, compressed)
    centrals.push(central)
    offset += local.length + compressed.length
  }

  const centralDir = Buffer.concat(centrals)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0) // end of central directory
  end.writeUInt16LE(0, 4)
  end.writeUInt16LE(0, 6)
  end.writeUInt16LE(entries.length, 8)
  end.writeUInt16LE(entries.length, 10)
  end.writeUInt32LE(centralDir.length, 12)
  end.writeUInt32LE(offset, 16)
  end.writeUInt16LE(0, 20) // comment length

  return Buffer.concat([...locals, centralDir, end])
}

// ----------------------------------------------------------------- xml ----

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    // XML 1.0 forbids most control characters outright; strip rather than emit
    // a file Excel will refuse to open.
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '')
}

/** 0 -> A, 25 -> Z, 26 -> AA */
function columnName(index: number): string {
  let name = ''
  let n = index
  while (n >= 0) {
    name = String.fromCharCode(65 + (n % 26)) + name
    n = Math.floor(n / 26) - 1
  }
  return name
}

function cellXml(value: CellValue, row: number, col: number, bold: boolean): string {
  if (value === null || value === undefined || value === '') return ''
  const ref = `${columnName(col)}${row}`
  const style = bold ? ' s="1"' : ''

  if (typeof value === 'number' && Number.isFinite(value)) {
    return `<c r="${ref}"${style}><v>${value}</v></c>`
  }
  // Inline strings keep this to one part — no sharedStrings table to maintain.
  return `<c r="${ref}"${style} t="inlineStr"><is><t xml:space="preserve">${escapeXml(
    String(value)
  )}</t></is></c>`
}

const XML_HEADER = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'

export interface SheetOptions {
  /** Sheet tab name. Excel forbids : \ / ? * [ ] and caps it at 31 chars. */
  name?: string
  /** Render the first row bold. */
  headerRow?: boolean
  /** Column widths in characters. */
  columnWidths?: number[]
}

/**
 * Builds a single-sheet .xlsx workbook from a grid of rows.
 *
 * Numbers are written as numbers so Excel can sum them; everything else becomes
 * an inline string.
 */
export function buildXlsx(rows: CellValue[][], options: SheetOptions = {}): Buffer {
  const { headerRow = false, columnWidths } = options
  const sheetName = (options.name ?? 'Sheet1').replace(/[:\\/?*[\]]/g, ' ').slice(0, 31)

  const cols = columnWidths?.length
    ? `<cols>${columnWidths
        .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`)
        .join('')}</cols>`
    : ''

  const sheetData = rows
    .map((row, r) => {
      const cells = row
        .map((value, c) => cellXml(value, r + 1, c, headerRow && r === 0))
        .join('')
      return `<row r="${r + 1}">${cells}</row>`
    })
    .join('')

  const sheet =
    `${XML_HEADER}<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `${cols}<sheetData>${sheetData}</sheetData></worksheet>`

  const contentTypes =
    `${XML_HEADER}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
    '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
    '</Types>'

  const rels =
    `${XML_HEADER}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
    '</Relationships>'

  const workbook =
    `${XML_HEADER}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ` +
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    `<sheets><sheet name="${escapeXml(sheetName)}" sheetId="1" r:id="rId1"/></sheets></workbook>`

  const workbookRels =
    `${XML_HEADER}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
    '</Relationships>'

  // Two cell formats: 0 = plain, 1 = bold (used by the header row).
  const styles =
    `${XML_HEADER}<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font>' +
    '<font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
    '<fills count="2"><fill><patternFill patternType="none"/></fill>' +
    '<fill><patternFill patternType="gray125"/></fill></fills>' +
    '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    '<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
    '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>' +
    // Readers expect a named default style; without it openpyxl warns and some
    // Excel builds are less forgiving.
    '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
    '</styleSheet>'

  return zip([
    { name: '[Content_Types].xml', data: Buffer.from(contentTypes, 'utf8') },
    { name: '_rels/.rels', data: Buffer.from(rels, 'utf8') },
    { name: 'xl/workbook.xml', data: Buffer.from(workbook, 'utf8') },
    { name: 'xl/_rels/workbook.xml.rels', data: Buffer.from(workbookRels, 'utf8') },
    { name: 'xl/styles.xml', data: Buffer.from(styles, 'utf8') },
    { name: 'xl/worksheets/sheet1.xml', data: Buffer.from(sheet, 'utf8') },
  ])
}
