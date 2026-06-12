// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Prisma 7: connection URL goes to the client constructor, not the schema.
// DATABASE_URL is a prisma+postgres:// URL (local `prisma dev` / Prisma Postgres);
// a direct postgres:// URL would need a driver adapter (@prisma/adapter-pg) instead.
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  accelerateUrl: process.env.DATABASE_URL!,
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}