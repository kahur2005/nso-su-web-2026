'use client'
import { useMemo, useState } from 'react'

export interface StudentOption {
  studentId: string
  name: string
  email?: string | null
  groupName?: string | null
}

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
  const [useDropdown, setUseDropdown] = useState(false)

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return students.slice(0, 10)
    return students
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.studentId.toLowerCase().includes(q) ||
          (s.email?.toLowerCase().includes(q) ?? false)
      )
      .slice(0, 10)
  }, [query, students])

  const effectiveStudentId = useMemo(() => {
    if (selected) return selected.studentId
    const q = query.trim().toLowerCase()
    if (!q) return ''
    const match = students.find(
      (s) => s.name.toLowerCase() === q || s.studentId.toLowerCase() === q
    )
    return match ? match.studentId : query.trim()
  }, [selected, query, students])

  function choose(s: StudentOption) {
    setSelected(s)
    setQuery(s.name)
    setOpen(false)
  }

  return (
    <div className="relative space-y-1.5">
      <div className="flex justify-between items-center text-xs">
        <span className="text-slate-500 font-medium">Select Student:</span>
        <button
          type="button"
          onClick={() => setUseDropdown(!useDropdown)}
          className="text-slate-600 hover:text-slate-900 underline text-[11px]"
        >
          {useDropdown ? 'Switch to Search box' : 'Switch to Dropdown list'}
        </button>
      </div>

      {/* Submitted value — the server action reads this */}
      <input type="hidden" name="studentId" value={effectiveStudentId} />

      {useDropdown ? (
        <select
          className={inputClass}
          value={effectiveStudentId}
          onChange={(e) => {
            const found = students.find((s) => s.studentId === e.target.value)
            if (found) choose(found)
          }}
          required
        >
          <option value="">-- Select a student ({students.length} total) --</option>
          {students.map((s) => (
            <option key={s.studentId} value={s.studentId}>
              {s.name} ({s.studentId}) {s.groupName ? `[${s.groupName}]` : '[Unassigned]'}
            </option>
          ))}
        </select>
      ) : (
        <div className="relative">
          <input
            className={inputClass}
            placeholder="Type name or student ID..."
            value={query}
            autoComplete="off"
            required={!effectiveStudentId}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelected(null)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
          />

          {open && matches.length > 0 && (
            <ul className="absolute left-0 right-0 top-full mt-1 z-30 max-h-56 overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg text-xs">
              {matches.map((s) => (
                <li
                  key={s.studentId}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    choose(s)
                  }}
                  className="px-3 py-2 hover:bg-slate-50 cursor-pointer flex justify-between items-center border-b border-slate-100 last:border-0"
                >
                  <div>
                    <p className="font-medium text-slate-800">{s.name}</p>
                    <p className="text-[11px] text-slate-400">ID: {s.studentId}</p>
                  </div>
                  <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {s.groupName ? s.groupName : 'Unassigned'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {selected && (
        <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2.5 py-1">
          ✓ Selected: <span className="font-semibold">{selected.name}</span> ({selected.studentId})
        </p>
      )}
    </div>
  )
}
