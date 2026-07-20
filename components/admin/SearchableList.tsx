'use client'
// Client-side filter box. Datasets here are small (hundreds of rows at most),
// so filtering in memory avoids a round trip per keystroke.
import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'

export default function SearchableList<T,>({
  items,
  filter,
  placeholder,
  render,
}: {
  items: T[]
  filter: (item: T, query: string) => boolean
  placeholder: string
  render: (filtered: T[]) => React.ReactNode
}) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((item) => filter(item, q))
  }, [items, query, filter])

  return (
    <div className="space-y-3">
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md
            bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10
            focus:border-slate-400"
        />
      </div>
      <p className="text-xs text-slate-500">
        {filtered.length} of {items.length}
      </p>
      {render(filtered)}
    </div>
  )
}
