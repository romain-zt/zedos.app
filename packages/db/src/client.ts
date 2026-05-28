import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres, { type Sql } from 'postgres';
import * as schema from './schema';

export type DrizzleDb = PostgresJsDatabase<typeof schema>;

type DbGlobal = typeof globalThis & {
  __zedosPostgres?: Sql;
  __zedosDrizzle?: DrizzleDb;
  __zedosShutdownHooksRegistered?: boolean;
};

const globalForDb = globalThis as DbGlobal;

function poolMaxConnections(): number {
  const raw = process.env.DATABASE_POOL_MAX;
  if (raw != null && raw !== '') {
    const n = parseInt(raw, 10);
    if (Number.isFinite(n) && n >= 1) return n;
  }
  return process.env.NODE_ENV === 'production' ? 5 : 3;
}

function idleTimeoutSeconds(): number {
  const raw = process.env.DATABASE_IDLE_TIMEOUT_SEC;
  if (raw != null && raw !== '') {
    const n = parseInt(raw, 10);
    if (Number.isFinite(n) && n >= 1) return n;
  }
  return 20;
}

function createPostgresClient(): Sql {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  return postgres(connectionString, {
    max: poolMaxConnections(),
    /** Ferme les connexions inactives du pool (évite l’accumulation côté Postgres). */
    idle_timeout: idleTimeoutSeconds(),
    /** Recycle les connexions ouvertes trop longtemps. */
    max_lifetime: 60 * 10,
    connect_timeout: 10,
  });
}

function registerShutdownHooks(): void {
  if (globalForDb.__zedosShutdownHooksRegistered) return;
  globalForDb.__zedosShutdownHooksRegistered = true;

  const onShutdown = () => {
    void closeDatabaseConnections();
  };

  process.once('SIGINT', onShutdown);
  process.once('SIGTERM', onShutdown);
  process.once('beforeExit', onShutdown);
}

function getPostgresClient(): Sql {
  if (!globalForDb.__zedosPostgres) {
    globalForDb.__zedosPostgres = createPostgresClient();
    registerShutdownHooks();
  }
  return globalForDb.__zedosPostgres;
}

function getDrizzleDb(): DrizzleDb {
  if (!globalForDb.__zedosDrizzle) {
    globalForDb.__zedosDrizzle = drizzle(getPostgresClient(), { schema });
  }
  return globalForDb.__zedosDrizzle;
}

/**
 * Ferme toutes les connexions du pool (scripts, tests, arrêt du process).
 * Les connexions inactives sont aussi libérées automatiquement via `idle_timeout`.
 */
export async function closeDatabaseConnections(): Promise<void> {
  const sql = globalForDb.__zedosPostgres;
  delete globalForDb.__zedosPostgres;
  delete globalForDb.__zedosDrizzle;

  if (sql) {
    await sql.end({ timeout: 5 });
  }
}

/** Instance Drizzle partagée (une seule par process Node — survit au HMR Next.js). */
export const db: DrizzleDb = new Proxy({} as DrizzleDb, {
  get(_target, prop) {
    const instance = getDrizzleDb();
    return Reflect.get(instance, prop);
  },
});
