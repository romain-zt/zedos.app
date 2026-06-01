import assert from 'node:assert';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { parseDatabaseUrlAssignments } from './database-url.mjs';

test('parseDatabaseUrlAssignments returns all non-comment DATABASE_URL lines', () => {
  const dir = mkdtempSync(join(tmpdir(), 'db-url-'));
  const envPath = join(dir, '.env');
  writeFileSync(
    envPath,
    [
      '# DATABASE_URL=postgresql://ignored:5432/x',
      "DATABASE_URL='postgresql://first:5432/a'",
      'DATABASE_URL=postgresql://second:5432/b',
    ].join('\n'),
  );

  assert.deepEqual(parseDatabaseUrlAssignments(envPath), [
    'postgresql://first:5432/a',
    'postgresql://second:5432/b',
  ]);
});
