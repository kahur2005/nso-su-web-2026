// lib/auth.ts
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { supabase } from './supabase'
import { verifyPassword } from './password'

export const authOptions: NextAuthOptions = {
  // Credentials auth requires JWT sessions (no DB session table).
  session: { strategy: 'jwt' },
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const { data: student } = await supabase
          .from('Student')
          .select('*')
          .eq('email', credentials.email.toLowerCase().trim())
          .maybeSingle()
        if (!student || !student.password) return null

        if (!verifyPassword(credentials.password, student.password)) return null

        return {
          id: student.studentId,
          name: student.name,
          email: student.email,
          studentId: student.studentId,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user && 'studentId' in user && typeof user.studentId === 'string') {
        token.studentId = user.studentId
      }
      const targetStudentId = (token.studentId as string) || (user as any)?.studentId
      if (targetStudentId) {
        const { data: student } = await supabase
          .from('Student')
          .select('isAdmin, points, role, groupId')
          .eq('studentId', targetStudentId)
          .maybeSingle()
        token.isAdmin = Boolean(student?.isAdmin || student?.role === 'admin')
        token.points = student?.points || 0
        token.role = student?.role || (token.isAdmin ? 'admin' : 'student')
        token.groupId = student?.groupId || null
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.studentId = (token.studentId as string) ?? ''
        session.user.isAdmin = (token.isAdmin as boolean) ?? false
        session.user.points = (token.points as number) ?? 0
        session.user.role = (token.role as string) ?? 'student'
        session.user.groupId = (token.groupId as string | null) ?? null
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
}
