import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const migrationsDir = join(process.cwd(), 'src', 'migrations');

/**
 * Normalizes SQL to detect semantic duplicates across files.
 * - strips single-line comments
 * - strips Drizzle statement breakpoints
 * - collapses whitespace
 */
function normalizeSql(sql) {
  return sql
    .replace(/-->.*/g, '')
    .replace(/--.*$/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function hashContent(content) {
  return createHash('sha256').update(content).digest('hex');
}

function listSqlMigrations(dir) {
  return readdirSync(dir)
    .filter((name) => name.endsWith('.sql'))
    .map((name) => join(dir, name))
    .filter((path) => statSync(path).isFile())
    .sort((a, b) => a.localeCompare(b));
}

function main() {
  const files = listSqlMigrations(migrationsDir);
  const byHash = new Map();

  for (const filePath of files) {
    const raw = readFileSync(filePath, 'utf8');
    const normalized = normalizeSql(raw);
    if (!normalized) continue;

    const digest = hashContent(normalized);
    const existing = byHash.get(digest);

    if (existing) {
      const current = filePath.replace(`${migrationsDir}\\`, '');
      const first = existing.replace(`${migrationsDir}\\`, '');
      console.error(
        [
          'Duplicate migration content detected.',
          `- First: ${first}`,
          `- Duplicate: ${current}`,
          'Remove or regenerate one migration before continuing.',
        ].join('\n'),
      );
      process.exit(1);
    }

    byHash.set(digest, filePath);
  }

  console.log('No duplicate SQL migrations detected.');
}

main();
