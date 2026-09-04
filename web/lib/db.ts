import { PrismaClient } from '@prisma/client';

// One client per process. Next's dev server re-evaluates modules on every edit,
// and a fresh PrismaClient each time exhausts the connection pool within a
// minute of normal work.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
