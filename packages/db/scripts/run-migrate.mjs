#!/usr/bin/env node
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import postgres from 'postgres';
import { loadDatabaseUrl } from './database-url.mjs';

const packageRoot = resolve(import.meta.dirname, '..');
const migrationsFolder = join(packageRoot, 'src/migrations');
const migrationsSchema = 'drizzle';
const migrationsTable = '__drizzle_migrations';

/**
 * Drizzle Kit compares only the latest journal timestamp, so migrations with an
 * out-of-order `when` value are silently skipped. Apply by content hash instead.
 *
 * @param {import('postgres').Sql} sql
 * @returns {Promise<string[]>}
 */
export async function applyPendingMigrationsByHash(sql) {
  await sql.unsafe(`CREATE SCHEMA IF NOT EXISTS ${migrationsSchema}`);
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS ${migrationsSchema}.${migrationsTable} (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `);

  const journal = JSON.parse(
    readFileSync(join(migrationsFolder, 'meta/_journal.json'), 'utf8'),
  );

  const appliedRows = await sql`
    SELECT hash FROM ${sql(migrationsSchema)}.${sql(migrationsTable)}
  `;
  const appliedHashes = new Set(appliedRows.map((row) => row.hash));

  /** @type {string[]} */
  const appliedTags = [];

  for (const entry of journal.entries) {
    const migrationPath = join(migrationsFolder, `${entry.tag}.sql`);
    const query = readFileSync(migrationPath, 'utf8');
    const hash = createHash('sha256').update(query).digest('hex');

    if (appliedHashes.has(hash)) {
      continue;
    }

    const statements = query
      .split('--> statement-breakpoint')
      .map((statement) => statement.trim())
      .filter(Boolean);

    await sql.begin(async (tx) => {
      for (const statement of statements) {
        await tx.unsafe(statement);
      }
      await tx.unsafe(
        `INSERT INTO ${migrationsSchema}.${migrationsTable} (hash, created_at) VALUES ($1, $2)`,
        [hash, entry.when],
      );
    });

    appliedHashes.add(hash);
    appliedTags.push(entry.tag);
  }

  return appliedTags;
}

/**
 * @param {import('postgres').Sql} sql
 */
async function assertTaskSplitTables(sql) {
  const [{ exists }] = await sql`
    SELECT to_regclass('public.task_split_bundles') IS NOT NULL AS exists
  `;
  if (!exists) {
    throw new Error(
      'Migration finished but public.task_split_bundles is still missing. ' +
        'Check DATABASE_URL targets the same database as production.',
    );
  }
}

async function main() {
  const { url, source, host } = loadDatabaseUrl();
  console.log(`[db:migrate] Target database: ${host}`);
  console.log(`[db:migrate] DATABASE_URL from: ${source}`);

  const sql = postgres(url, { max: 1, onnotice: () => {} });

  try {
    const appliedTags = await applyPendingMigrationsByHash(sql);

    if (appliedTags.length === 0) {
      console.log('[db:migrate] No pending migrations — database is up to date.');
    } else {
      console.log(`[db:migrate] Applied ${appliedTags.length} migration(s): ${appliedTags.join(', ')}`);
    }

    await assertTaskSplitTables(sql);
    console.log('[db:migrate] Verified public.task_split_bundles exists.');
    console.log('[db:migrate] Done.');
  } finally {
    await sql.end();
  }
}

const isMainModule =
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isMainModule) {
  main().catch((error) => {
    console.error('[db:migrate] Failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
