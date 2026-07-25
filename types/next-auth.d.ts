// types/next-auth.d.ts
import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      studentId: string
      isAdmin: boolean
      points: number
      role?: string
      groupId?: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    studentId?: string
    isAdmin?: boolean
    points?: number
    role?: string
    groupId?: string | null
  }
}
