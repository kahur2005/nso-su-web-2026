'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import PageWrapper from '@/components/layout/PageWrapper'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface StudentItem {
  id: string
  studentId: string
  name: string
  points: number
  group?: { name: string } | null
}

export default function GlPanelPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [query, setQuery] = useState('')
  const [students, setStudents] = useState<StudentItem[]>([])
  const [selectedStudent, setSelectedStudent] = useState<StudentItem | null>(null)
  const [amount, setAmount] = useState(10)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [suspense, setSuspense] = useState<boolean | null>(null)

  const isAuthorized =
    session?.user &&
    ((session.user as any).role === 'gl' ||
      (session.user as any).role === 'committee' ||
      (session.user as any).isAdmin)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (!isAuthorized) return
    fetch('/api/app-settings')
      .then((r) => r.json())
      .then((d) => setSuspense(Boolean(d.leaderboardSuspense)))
      .catch(() => setSuspense(false))
  }, [isAuthorized])

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    setError('')
    try {
      const res = await fetch(`/api/leaderboard?search=${encodeURIComponent(query)}`)
      const data = await res.json()
      setStudents(data.topStudents || data.students || [])
    } catch {
      setError('Failed to search students.')
    } finally {
      setSearching(false)
    }
  }

  async function handleAward(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedStudent) return
    setLoading(true)
    setMessage('')
    setError('')

    try {
      const res = await fetch('/api/gl/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent.studentId,
          amount,
          reason,
        }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to assign points.')
        return
      }

      setMessage(`Success! Awarded ${amount} pts to ${selectedStudent.name}.`)
      setSelectedStudent(null)
      setReason('')
      setQuery('')
      setStudents([])
    } catch {
      setError('Connection error.')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return <PageWrapper><LoadingSpinner text="LOADING GL PANEL..." /></PageWrapper>
  }

  if (!isAuthorized) {
    return (
      <PageWrapper>
        <div className="game-column py-12 text-center">
          <h1 className="title-gold font-bytebounce text-fluid-2xl">
            RESTRICTED AREA
          </h1>
          <p className="mt-2 font-bytebounce text-fluid-base text-white">
            Only Group Leaders (GL) and Committee Members have access to point assignment.
          </p>
        </div>
      </PageWrapper>
    )
  }

  if (suspense === null) {
    return <PageWrapper><LoadingSpinner text="LOADING GL PANEL..." /></PageWrapper>
  }

  if (suspense) {
    return (
      <PageWrapper>
        <div className="game-column py-12 text-center">
          <h1 className="title-gold font-bytebounce text-fluid-2xl">
            GL POINT PANEL
          </h1>
          <p className="mt-2 font-bytebounce text-fluid-base text-white">
            Point assignment is paused until the leaderboard is revealed.
          </p>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <div className="game-column pb-6 pt-3">
        <h1 className="title-gold text-center font-bytebounce text-[clamp(2.4rem,12vw,3.2rem)] leading-[0.85]">
          GL POINT PANEL
        </h1>
        <p
          className="mt-1 text-center font-bytebounce text-fluid-base leading-tight text-white"
          style={{ textShadow: '2px 2px 0 #4e342e' }}
        >
          Assign group & student task points
        </p>

        {/* Search form */}
        <form onSubmit={handleSearch} className="mt-4 flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search student name or NSO-ID..."
            className="flex-1 rounded-md border-2 border-[#3a2418] bg-[#fdf6e3] px-3 py-2 font-bytebounce text-fluid-base text-[#3e2723] focus:outline-none"
          />
          <button
            type="submit"
            disabled={searching}
            className="rounded border-2 border-[#3a2418] bg-[#8a5a37] px-4 py-2 font-bytebounce text-fluid-base text-[#ffd23f] active:translate-y-0.5"
          >
            {searching ? '...' : 'Search'}
          </button>
        </form>

        {/* Search Results */}
        {students.length > 0 && (
          <div className="mt-3 space-y-2 rounded-md border-2 border-[#3a2418] bg-[#f5e7c6] p-2 max-h-48 overflow-y-auto">
            {students.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedStudent(s)}
                className={`w-full text-left p-2 rounded flex justify-between items-center font-bytebounce text-fluid-base ${
                  selectedStudent?.id === s.id
                    ? 'bg-[#8a5a37] text-[#ffd23f]'
                    : 'bg-[#fdf6e3] text-[#3e2723] hover:bg-[#e0d3ae]'
                }`}
              >
                <div>
                  <span className="font-bold">{s.name}</span>
                  <span className="text-fluid-xs opacity-75 ml-2">({s.studentId})</span>
                </div>
                <span className="font-bold">{s.points} pts</span>
              </button>
            ))}
          </div>
        )}

        {/* Selected Student Award Form */}
        {selectedStudent && (
          <form onSubmit={handleAward} className="mt-4 rounded-md border-2 border-[#3a2418] bg-[#fdf6e3] p-4 space-y-3">
            <h2 className="font-bytebounce text-fluid-md text-[#3e2723]">
              Assigning to: <span className="text-[#b8860b]">{selectedStudent.name}</span>
            </h2>

            <div>
              <label className="block font-bytebounce text-fluid-sm text-[#5d4330]">Point Amount</label>
              <div className="flex gap-2 mt-1">
                {[5, 10, 20, 50].map((pts) => (
                  <button
                    key={pts}
                    type="button"
                    onClick={() => setAmount(pts)}
                    className={`flex-1 py-1 rounded border-2 border-[#3a2418] font-bytebounce text-fluid-sm ${
                      amount === pts ? 'bg-[#8a5a37] text-[#ffd23f]' : 'bg-[#f5e7c6] text-[#3e2723]'
                    }`}
                  >
                    +{pts}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="mt-2 w-full rounded border-2 border-[#3a2418] bg-white px-3 py-1.5 font-bytebounce text-fluid-base text-[#3e2723]"
              />
            </div>

            <div>
              <label className="block font-bytebounce text-fluid-sm text-[#5d4330]">Reason / Task Name</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Completed Group Icebreaker"
                className="mt-1 w-full rounded border-2 border-[#3a2418] bg-white px-3 py-1.5 font-bytebounce text-fluid-base text-[#3e2723]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded border-2 border-[#3a2418] bg-[#8a5a37] py-2 font-bytebounce text-fluid-md text-[#ffd23f] active:translate-y-0.5 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Confirm Points'}
            </button>
          </form>
        )}

        {message && (
          <p className="mt-3 text-center font-bytebounce text-fluid-base text-[#4a7c2f]">
            {message}
          </p>
        )}

        {error && (
          <p className="mt-3 text-center font-bytebounce text-fluid-base text-[#d6101d]">
            {error}
          </p>
        )}
      </div>
    </PageWrapper>
  )
}
