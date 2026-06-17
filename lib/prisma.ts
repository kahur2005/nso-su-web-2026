// lib/prisma.ts
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Prisma 7: connection config goes to the client constructor, not the schema.
// DATABASE_URL is a direct postgres:// URL (local `npx prisma dev` server),
// connected through the pg driver adapter.
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}