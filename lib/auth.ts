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
    async jwt({ token, user }: any) {
      // `user` is only present at sign-in; refresh the cached claims then.
      if (user?.studentId) {
        token.studentId = user.studentId
        const { data: student } = await supabase
          .from('Student')
          .select('isAdmin, points')
          .eq('studentId', user.studentId)
          .maybeSingle()
        token.isAdmin = student?.isAdmin || false
        token.points = student?.points || 0
      }
      return token
    },
    async session({ session, token }) {
      (session.user as any).studentId = token.studentId
      ;(session.user as any).isAdmin = token.isAdmin
      ;(session.user as any).points = token.points
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
}
