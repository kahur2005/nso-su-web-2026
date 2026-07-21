// components/admin/NpcSearchableTable.tsx
'use client'
// SearchableList's filter/render callbacks are functions, which cannot cross
// the server -> client boundary as props. This wrapper owns those callbacks
// client-side and receives the plain NPC array from the server page instead.
import { useState } from 'react'
import SearchableList from '@/components/admin/SearchableList'
import DataTable from '@/components/admin/DataTable'
import QrPreviewModal from '@/components/admin/QrPreviewModal'
import { divisionName } from '@/lib/divisions'
import { toggleNpcActive } from '@/app/admin/actions'

export interface NpcRow {
  id: string
  committeeName: string
  role: string
  division: string | null
  funFact: string
  points: number
  qrCode: string | null
  isActive: boolean
  scanCount: number
}

export default function NpcSearchableTable({ npcs }: { npcs: NpcRow[] }) {
  // The QR being previewed, or null. Held here rather than per-row so only one
  // modal is ever mounted.
  const [preview, setPreview] = useState<{ name: string; qrCode: string } | null>(null)

  return (
    <>
    <SearchableList
      items={npcs}
      placeholder="Search by name, role, division, or fun fact..."
      filter={(npc, query) =>
        // `query` arrives pre-trimmed and pre-lowercased by SearchableList, so
        // only the item side needs lowercasing here.
        npc.committeeName.toLowerCase().includes(query) ||
        npc.role.toLowerCase().includes(query) ||
        npc.funFact.toLowerCase().includes(query) ||
        divisionName(npc.division).toLowerCase().includes(query)
      }
      render={(filtered) => (
        <DataTable
          headers={['Name', 'Division', 'Role', 'Fun fact', 'Points', 'Scans', 'QR', 'Status']}
        >
          {filtered.map((npc) => (
            <tr key={npc.id}>
              <td className="px-4 py-2.5 font-medium text-slate-800 whitespace-nowrap">
                {npc.committeeName}
              </td>
              <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">
                {divisionName(npc.division)}
              </td>
              <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">{npc.role}</td>
              <td className="px-4 py-2.5 text-slate-600 max-w-xs truncate" title={npc.funFact}>
                {npc.funFact}
              </td>
              <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">{npc.points}</td>
              <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">{npc.scanCount}</td>
              <td className="px-4 py-2.5">
                {npc.qrCode ? (
                  // Opens a modal rather than linking to the data: URL --
                  // browsers block top-level navigation to data: URLs, so an
                  // anchor here just opens a blank tab.
                  <button
                    type="button"
                    onClick={() =>
                      setPreview({ name: npc.committeeName, qrCode: npc.qrCode! })
                    }
                    title={`View QR for ${npc.committeeName}`}
                    aria-label={`View QR code for ${npc.committeeName}`}
                    className="block rounded hover:ring-2 hover:ring-slate-300 focus:outline-none
                      focus:ring-2 focus:ring-slate-400"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={npc.qrCode}
                      alt={`QR for ${npc.committeeName}`}
                      className="w-10 h-10 border border-slate-200 rounded bg-white"
                      width={40}
                      height={40}
                    />
                  </button>
                ) : (
                  <span className="text-xs text-slate-400">None</span>
                )}
              </td>
              <td className="px-4 py-2.5 whitespace-nowrap">
                <form action={toggleNpcActive.bind(null, npc.id)}>
                  <button
                    type="submit"
                    className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors
                      ${npc.isActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                      }`}
                  >
                    {npc.isActive ? 'Active' : 'Inactive'}
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    />

    {preview && (
      <QrPreviewModal
        name={preview.name}
        qrCode={preview.qrCode}
        onClose={() => setPreview(null)}
      />
    )}
    </>
  )
}
