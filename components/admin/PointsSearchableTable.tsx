'use client'
import { useState } from 'react'
import SearchableList from '@/components/admin/SearchableList'
import DataTable from '@/components/admin/DataTable'
import GroupEmblem from '@/components/ui/GroupEmblem'
import PointsAdjustModal from '@/components/admin/PointsAdjustModal'

export interface PointsRow {
  studentId: string
  name: string
  email: string
  points: number
  group: {
    name: string
    emblem: string | null
    emblemUrl: string | null
    color: string | null
  } | null
}

export default function PointsSearchableTable({ students }: { students: PointsRow[] }) {
  const [selected, setSelected] = useState<PointsRow | null>(null)

  return (
    <>
      <SearchableList
        items={students}
        placeholder="Search by name, email, student ID, or group..."
        filter={(student, query) =>
          student.name.toLowerCase().includes(query) ||
          student.email.toLowerCase().includes(query) ||
          student.studentId.toLowerCase().includes(query) ||
          (student.group?.name.toLowerCase().includes(query) ?? false)
        }
        render={(filtered) => (
          <DataTable headers={['Player', 'Student ID', 'Group', 'Points']}>
            {filtered.map((student) => (
              <tr
                key={student.studentId}
                onClick={() => setSelected(student)}
                className="cursor-pointer hover:bg-slate-50"
              >
                <td className="px-4 py-2.5 font-medium text-slate-800 whitespace-nowrap">
                  {student.name}
                </td>
                <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">
                  {student.studentId}
                </td>
                <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">
                  {student.group ? (
                    <span className="inline-flex items-center gap-1.5">
                      <GroupEmblem
                        emblem={student.group.emblem}
                        emblemUrl={student.group.emblemUrl}
                        size={16}
                      />
                      {student.group.name}
                    </span>
                  ) : (
                    <span className="text-slate-400">Unassigned</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">{student.points}</td>
              </tr>
            ))}
          </DataTable>
        )}
      />

      {selected && (
        <PointsAdjustModal
          student={{
            studentId: selected.studentId,
            name: selected.name,
            points: selected.points,
          }}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}
