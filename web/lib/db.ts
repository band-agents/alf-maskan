import { Prisma, PrismaClient } from '@prisma/client';

// One client per process. Next's dev server re-evaluates modules on every edit,
// and a fresh PrismaClient each time exhausts the connection pool within a
// minute of normal work.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; amDbWarned?: boolean };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

// ─────────────────────────────────────────────── working without a database

/**
 * `DATABASE_URL` still points at a Postgres nobody has started, and resolving a
 * tenant is a query — so without this the entire storefront 500s before it can
 * render a single line of the design system.
 *
 * This is the ONE place that decides to serve mock data instead. It is
 * deliberately narrow: only the error codes Prisma raises when it cannot reach
 * or authenticate against a server are caught. A malformed query, a missing
 * column or a constraint violation still throws as itself, because a fallback
 * that swallows those would turn every real bug into "the page renders, just
 * with the wrong data" — the most expensive kind of failure to find.
 *
 * Delete this the day `prisma db push` runs, along with `lib/mock.ts`.
 */
const UNREACHABLE = new Set([
  'P1000', // authentication failed
  'P1001', // can't reach database server
  'P1002', // server reached but timed out
  'P1003', // database does not exist
  'P1017', // server closed the connection
]);

function isUnreachable(error: unknown): boolean {
  // Thrown when the connection cannot be opened at all, including a DATABASE_URL
  // that is missing or unparseable. `errorCode` is undefined for the latter.
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return error.errorCode == null || UNREACHABLE.has(error.errorCode);
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return UNREACHABLE.has(error.code);
  }
  return false;
}

export async function orMock<T>(query: () => Promise<T>, mock: () => T): Promise<T> {
  try {
    return await query();
  } catch (error) {
    if (!isUnreachable(error)) throw error;
    // Once per process, not once per request: a storefront page fans out into
    // several queries and the warning is meant to be read, not scrolled past.
    if (!globalForPrisma.amDbWarned) {
      globalForPrisma.amDbWarned = true;
      console.warn(
        '[alf-maskan] No database reachable — serving mock data. ' +
          'Set DATABASE_URL and run `npm run db:push` to use real data. See web/HANDOFF.md.'
      );
    }
    return mock();
  }
}
