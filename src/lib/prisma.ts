import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient()
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

// In development, if schema models change while dev server is alive,
// discard stale cached instance so new models (like gameRoulette) are available.
if (globalThis.prisma && !(globalThis.prisma as any).gameRoulette) {
  try {
    globalThis.prisma.$disconnect()
  } catch {}
  globalThis.prisma = undefined
}

export const db = globalThis.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalThis.prisma = db

