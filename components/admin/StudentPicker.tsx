'use client'
import { useMemo, useState } from 'react'

export interface StudentOption {
  studentId: string
  name: string
  email?: string | null
  groupName?: string | null
}

// Search-by-name picker for admin forms. The admin types a name; the matching
// student is chosen from a dropdown and its (unique) studentId is submitted via
// a hidden field named `studentId`, so the existing server actions are unchanged.
export default function StudentPicker({
  students,
  inputClass,
}: {
  students: StudentOption[]
  inputClass: string
}) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<StudentOption | null>(null)
  const [open, setOpen] = useState(false)

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    const pool = q
      ? students.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.studentId.toLowerCase().includes(q) ||
            (s.email?.toLowerCase().includes(q) ?? false)
        )
      : students
    return pool.slice(0, 8)
  }, [query, students])

  function choose(s: StudentOption) {
    setSelected(s)
    setQuery(s.name)
    setOpen(false)
  }

  return (
    <div className="relative">
      {/* Submitted value — the actual server action reads this. */}
      <input type="hidden" name="studentId" value={selected?.studentId ?? ''} />

      <input
        className={inputClass}
        placeholder="SEARCH BY NAME..."
        value={query}
        autoComplete="off"
        required={!selected}
        onChange={(e) => {
          setQuery(e.target.value)
          setSelected(null)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />

      {open && matches.length > 0 && (
        <ul className="absolute z-30 left-0 right-0 mt-1 max-h-60 overflow-auto
          bg-gray-900 border-2 border-black" style={{ boxShadow: '3px 3px 0 #000' }}>
          {matches.map((s) => (
            <li key={s.studentId}>
              <button
                type="button"
                onClick={() => choose(s)}
                className="w-full text-left px-3 py-2 hover:bg-gray-800
                  border-b border-gray-800 last:border-0"
              >
                <span className="font-pixel text-xs text-white block truncate">
                  {s.name}
                </span>
                <span className="font-pixel text-[8px] text-gray-400">
                  {s.studentId}
                  {s.groupName ? ` · ${s.groupName}` : ' · UNASSIGNED'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && query.trim() && matches.length === 0 && (
        <div className="absolute z-30 left-0 right-0 mt-1 bg-gray-900 border-2 border-black p-3">
          <p className="font-pixel text-[8px] text-gray-500">NO PLAYER FOUND</p>
        </div>
      )}

      {selected && (
        <p className="font-pixel text-[8px] text-green-400 mt-1">
          ✓ {selected.name} ({selected.studentId})
        </p>
      )}
    </div>
  )
}
