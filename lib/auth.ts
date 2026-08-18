import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { supabase } from './supabase'
import { verifyPassword } from './password'

export const authOptions: NextAuthOptions = {
  // Use JWT session strategy for credentials authentication.
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
          id: student.id,
          name: student.name,
          email: student.email,
          studentId: student.studentId,
          isAdmin: Boolean(student.isAdmin),
          points: student.points || 0,
          role: student.isAdmin ? 'admin' : 'student',
          groupId: student.groupId || null,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as {
          id?: string
          studentId?: string
          isAdmin?: boolean
          points?: number
          role?: string
          groupId?: string | null
        }
        token.id = u.id ?? token.id
        token.studentId = u.studentId ?? token.studentId
        token.isAdmin = u.isAdmin ?? token.isAdmin
        token.points = u.points ?? token.points
        token.role = u.role ?? token.role
        token.groupId = u.groupId ?? token.groupId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? ''
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
