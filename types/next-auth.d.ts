// types/next-auth.d.ts
import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      name?: string | null
      email?: string | null
      image?: string | null
      studentId: string
      isAdmin: boolean
      points: number
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    studentId?: string
    isAdmin?: boolean
    points?: number
  }
}
