'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import type { AvatarConfig } from '@/lib/avatar'

// In-memory cache for avatar configuration.
let globalAvatarCache: AvatarConfig | null = null
let globalCacheStudentId: string | null = null

function readSessionStorage(cacheKey: string): AvatarConfig | null {
  if (typeof window === 'undefined') return null
  try {
    const cached = sessionStorage.getItem(cacheKey)
    return cached ? JSON.parse(cached) : null
  } catch {
    sessionStorage.removeItem(cacheKey)
    return null
  }
}

export function useStudentAvatar(): AvatarConfig | null {
  const { data: session, status } = useSession()
  const studentId = session?.user?.studentId ?? 'anon'
  const cacheKey = `nav-avatar:${studentId}`

  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig | null>(() => {
    if (globalCacheStudentId === studentId && globalAvatarCache) {
      return globalAvatarCache
    }
    const cached = readSessionStorage(cacheKey)
    if (cached) {
      globalAvatarCache = cached
      globalCacheStudentId = studentId
      return cached
    }
    return null
  })

  useEffect(() => {
    if (status !== 'authenticated' || !studentId || studentId === 'anon') return
    if (globalCacheStudentId === studentId && globalAvatarCache) return

    let isMounted = true

    fetch('/api/me/avatar')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.avatar && isMounted) {
          globalAvatarCache = data.avatar
          globalCacheStudentId = studentId
          setAvatarConfig(data.avatar)
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify(data.avatar))
          } catch {
            // Ignore storage errors
          }
        }
      })
      .catch(() => {})

    return () => {
      isMounted = false
    }
  }, [status, studentId, cacheKey])

  return avatarConfig
}
