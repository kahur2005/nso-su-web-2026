// components/admin/CommitteeSearchableList.tsx
'use client'
// SearchableList's filter/render callbacks are functions, which cannot cross
// the server -> client boundary as props. This wrapper owns those callbacks
// client-side and receives the plain NPC array from the server page instead.
// Same shape as NpcSearchableTable, but grouped by division (roster-centric
// view) rather than a flat table (QR-centric view).
import SearchableList from '@/components/admin/SearchableList'
import DeleteCommitteeButton from '@/components/admin/DeleteCommitteeButton'
import { DIVISIONS, divisionName } from '@/lib/divisions'

export interface CommitteeRow {
  id: string
  committeeName: string
  role: string
  division: string | null
  funFact: string
  avatarUrl: string | null
  qrCode: string | null
}

function MemberRow({ member }: { member: CommitteeRow }) {
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
          className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex-shrink-0"
          aria-hidden="true"
        />
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{member.committeeName}</p>
        <p className="text-xs text-slate-500 truncate">{member.role}</p>
        <p className="text-xs text-slate-400 truncate mt-0.5" title={member.funFact}>
          {member.funFact}
        </p>
      </div>

      <span
        className={`text-xs font-medium px-2 py-0.5 rounded-full border flex-shrink-0 whitespace-nowrap
          ${member.qrCode
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}
      >
        {member.qrCode ? 'QR ready' : 'No QR'}
      </span>

      <DeleteCommitteeButton id={member.id} name={member.committeeName} />
    </li>
  )
}

export default function CommitteeSearchableList({ members }: { members: CommitteeRow[] }) {
  return (
    <SearchableList
      items={members}
      placeholder="Search by name, role, or division..."
      filter={(member, query) =>
        // `query` arrives pre-trimmed and pre-lowercased by SearchableList, so
        // only the item side needs lowercasing here.
        member.committeeName.toLowerCase().includes(query) ||
        member.role.toLowerCase().includes(query) ||
        divisionName(member.division).toLowerCase().includes(query)
      }
      render={(filtered) => {
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
                    <p className="text-sm text-slate-400 border border-dashed border-slate-200 rounded-lg px-4 py-3">
                      No members in this division yet.
                    </p>
                  ) : (
                    <ul className="divide-y divide-slate-100 border border-slate-200 rounded-lg bg-white">
                      {group.map((m) => (
                        <MemberRow key={m.id} member={m} />
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
                    <MemberRow key={m.id} member={m} />
                  ))}
                </ul>
              </div>
            )}
          </div>
        )
      }}
    />
  )
}
