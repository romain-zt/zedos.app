import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * @param {string} filePath
 * @returns {string[]}
 */
export function parseDatabaseUrlAssignments(filePath) {
  if (!existsSync(filePath)) return [];

  const assignments = [];
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const match = trimmed.match(/^DATABASE_URL\s*=\s*(.+)$/);
    if (!match) continue;

    let value = match[1].trim();
    if (
      (value.startsWith("'") && value.endsWith("'")) ||
      (value.startsWith('"') && value.endsWith('"'))
    ) {
      value = value.slice(1, -1);
    }
    assignments.push(value);
  }

  return assignments;
}

/**
 * Resolve DATABASE_URL for CLI tools (migrate, drizzle-kit).
 * Prefers process.env, then packages/db/.env, then apps/web/.env.
 *
 * @returns {{ url: string, source: string, host: string }}
 */
export function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return formatResult(process.env.DATABASE_URL, 'process.env.DATABASE_URL');
  }

  // Drizzle Kit bundles its TypeScript config as CommonJS, where import.meta is
  // unavailable. Package scripts run with packages/db as their working directory.
  const packageRoot = resolve(process.cwd());
  const localEnvPath = resolve(packageRoot, '.env');
  const webEnvPath = resolve(packageRoot, '../../apps/web/.env');

  const localAssignments = parseDatabaseUrlAssignments(localEnvPath);
  if (localAssignments.length > 1) {
    throw new Error(
      `Multiple DATABASE_URL entries in ${localEnvPath}. ` +
        'Keep a single active line so migrate targets the same database as apps/web.',
    );
  }
  if (localAssignments.length === 1) {
    return formatResult(localAssignments[0], localEnvPath);
  }

  const webAssignments = parseDatabaseUrlAssignments(webEnvPath);
  if (webAssignments.length > 1) {
    throw new Error(
      `Multiple DATABASE_URL entries in ${webEnvPath}. ` +
        'Keep a single active line so migrate targets the same database as the app.',
    );
  }
  if (webAssignments.length === 1) {
    return formatResult(webAssignments[0], webEnvPath);
  }

  throw new Error(
    'DATABASE_URL is not set. Copy packages/db/.env.example to packages/db/.env ' +
      '(or set DATABASE_URL in apps/web/.env).',
  );
}

/**
 * @param {string} url
 * @param {string} source
 */
function formatResult(url, source) {
  let host = 'unknown';
  try {
    host = new URL(url).host;
  } catch {
    // keep unknown
  }
  return { url, source, host };
}
