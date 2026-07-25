// components/admin/CommitteeSearchableList.tsx
'use client'

import { useState } from 'react'
import SearchableList from '@/components/admin/SearchableList'
import DeactivateCommitteeButton from '@/components/admin/DeactivateCommitteeButton'
import GenerateQrButton from '@/components/admin/GenerateQrButton'
import EditCommitteeMemberModal from '@/components/admin/EditCommitteeMemberModal'
import QrPreviewModal from '@/components/admin/QrPreviewModal'
import DataTable from '@/components/admin/DataTable'
import { DIVISIONS, divisionName } from '@/lib/divisions'
import { LayoutGrid, Table } from 'lucide-react'

export interface CommitteeRow {
  id: string
  committeeName: string
  role: string
  division: string | null
  funFact: string
  points?: number
  scanCount?: number
  avatarUrl: string | null
  qrCode: string | null
  isActive: boolean
}

function MemberRow({
  member,
  onPreviewQr,
}: {
  member: CommitteeRow
  onPreviewQr: (name: string, qrCode: string) => void
}) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      {member.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={member.avatarUrl}
          alt={member.committeeName}
          className="w-10 h-10 rounded-full object-cover border border-slate-200 flex-shrink-0"
        />
      ) : (
        <div
          className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center text-xs text-slate-400 font-semibold"
          aria-hidden="true"
        >
          {member.committeeName.charAt(0)}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{member.committeeName}</p>
        <p className="text-xs text-slate-500 truncate">{member.role}</p>
        <p className="text-xs text-slate-400 truncate mt-0.5" title={member.funFact}>
          {member.funFact}
        </p>
      </div>

      {typeof member.points === 'number' && (
        <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 shrink-0">
          +{member.points} pts
        </span>
      )}

      {member.qrCode ? (
        <button
          type="button"
          onClick={() => onPreviewQr(member.committeeName, member.qrCode!)}
          className="text-xs font-medium px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 flex-shrink-0 whitespace-nowrap"
        >
          QR ready 🔍
        </button>
      ) : (
        <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200 flex-shrink-0 whitespace-nowrap">
          No QR
        </span>
      )}

      <span
        className={`text-xs font-medium px-2 py-0.5 rounded-full border flex-shrink-0 whitespace-nowrap
          ${member.isActive
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}
      >
        {member.isActive ? 'Active' : 'Inactive'}
      </span>

      <EditCommitteeMemberModal member={member} />

      <GenerateQrButton npcId={member.id} name={member.committeeName} hasQr={Boolean(member.qrCode)} />

      <DeactivateCommitteeButton id={member.id} name={member.committeeName} isActive={member.isActive} />
    </li>
  )
}

export default function CommitteeSearchableList({ members }: { members: CommitteeRow[] }) {
  const [viewMode, setViewMode] = useState<'division' | 'table'>('division')
  const [preview, setPreview] = useState<{ name: string; qrCode: string } | null>(null)

  const handlePreviewQr = (name: string, qrCode: string) => {
    setPreview({ name, qrCode })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 gap-1">
          <button
            type="button"
            onClick={() => setViewMode('division')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'division'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <LayoutGrid size={14} /> Grouped by Division
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'table'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Table size={14} /> All Members Table
          </button>
        </div>
      </div>

      <SearchableList
        items={members}
        placeholder="Search by name, role, division, or fun fact..."
        filter={(member, query) =>
          member.committeeName.toLowerCase().includes(query) ||
          member.role.toLowerCase().includes(query) ||
          member.funFact.toLowerCase().includes(query) ||
          divisionName(member.division).toLowerCase().includes(query)
        }
        render={(filtered) => {
          if (viewMode === 'table') {
            return (
              <DataTable
                headers={['Photo', 'Name', 'Division', 'Role', 'Fun fact', 'Points', 'Scans', 'QR Code', 'Status', 'Actions']}
              >
                {filtered.map((m) => (
                  <tr key={m.id}>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      {m.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={m.avatarUrl}
                          alt={m.committeeName}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs text-slate-400 font-semibold">
                          {m.committeeName.charAt(0)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-slate-800 whitespace-nowrap">
                      {m.committeeName}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">
                      {divisionName(m.division)}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">{m.role}</td>
                    <td className="px-4 py-2.5 text-slate-600 max-w-xs truncate" title={m.funFact}>
                      {m.funFact}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap font-medium">{m.points ?? 0}</td>
                    <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">{m.scanCount ?? 0}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      {m.qrCode ? (
                        <button
                          type="button"
                          onClick={() => handlePreviewQr(m.committeeName, m.qrCode!)}
                          title={`View QR for ${m.committeeName}`}
                          className="block rounded hover:ring-2 hover:ring-slate-300 focus:outline-none"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={m.qrCode}
                            alt={`QR for ${m.committeeName}`}
                            className="w-9 h-9 border border-slate-200 rounded bg-white"
                          />
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">None</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full border
                          ${m.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                      >
                        {m.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <EditCommitteeMemberModal member={m} />
                        <GenerateQrButton npcId={m.id} name={m.committeeName} hasQr={Boolean(m.qrCode)} />
                        <DeactivateCommitteeButton id={m.id} name={m.committeeName} isActive={m.isActive} />
                      </div>
                    </td>
                  </tr>
                ))}
              </DataTable>
            )
          }

          const unassigned = filtered.filter(
            (m) => !DIVISIONS.some((d) => d.id === m.division)
          )

          return (
            <div className="space-y-6">
              {DIVISIONS.map((division) => {
                const group = filtered.filter((m) => m.division === division.id)
                return (
                  <div key={division.id}>
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: division.color }}
                        aria-hidden="true"
                      />
                      <h2 className="text-sm font-semibold text-slate-800">{division.name}</h2>
                      <span className="text-xs text-slate-400">({group.length})</span>
                    </div>

                    {group.length === 0 ? (
                      <p className="text-sm text-slate-400 border border-dashed border-slate-200 rounded-lg px-4 py-3 bg-white">
                        No members in this division yet.
                      </p>
                    ) : (
                      <ul className="divide-y divide-slate-100 border border-slate-200 rounded-lg bg-white">
                        {group.map((m) => (
                          <MemberRow key={m.id} member={m} onPreviewQr={handlePreviewQr} />
                        ))}
                      </ul>
                    )}
                  </div>
                )
              })}

              {unassigned.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full bg-slate-300 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <h2 className="text-sm font-semibold text-slate-800">Unassigned</h2>
                    <span className="text-xs text-slate-400">({unassigned.length})</span>
                  </div>
                  <ul className="divide-y divide-slate-100 border border-slate-200 rounded-lg bg-white">
                    {unassigned.map((m) => (
                      <MemberRow key={m.id} member={m} onPreviewQr={handlePreviewQr} />
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )
        }}
      />

      {preview && (
        <QrPreviewModal
          name={preview.name}
          qrCode={preview.qrCode}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  )
}
