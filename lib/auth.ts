// lib/auth.ts
import { NextAuthOptions } from 'next-auth'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: 'campus-sso',
      name: 'Campus SSO',
      type: 'oauth',
      clientId: process.env.CAMPUS_CLIENT_ID!,
      clientSecret: process.env.CAMPUS_CLIENT_SECRET!,
      authorization: process.env.CAMPUS_AUTH_URL!,
      token: process.env.CAMPUS_TOKEN_URL!,
      userinfo: process.env.CAMPUS_USERINFO_URL!,
      profile(profile) {
        return {
          id: profile.student_id || profile.sub,
          name: profile.name || profile.full_name,
          email: profile.email,
          studentId: profile.student_id || profile.nim,
          faculty: profile.faculty,
          major: profile.major,
          year: profile.year,
        }
      }
    }
  ],
  callbacks: {
    async signIn({ profile }: any) {
      if (!profile) return false
      try {
        await prisma.student.upsert({
          where: { studentId: profile.studentId || profile.id },
          update: { name: profile.name, email: profile.email },
          create: {
            studentId: profile.studentId || profile.id,
            name: profile.name || 'Unknown',
            email: profile.email || '',
            faculty: profile.faculty || '',
            major: profile.major || '',
            year: profile.year || '',
          }
        })
        return true
      } catch {
        return false
      }
    },
    async jwt({ token, profile }: any) {
      if (profile) {
        token.studentId = profile.studentId || profile.id
        token.faculty = profile.faculty
        const student = await prisma.student.findUnique({
          where: { studentId: token.studentId as string }
        })
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
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  }
}