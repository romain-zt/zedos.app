import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test('better-auth migration defines sessions, accounts, verifications', () => {
  const sqlPath = path.join(__dirname, '0001_better_auth_tables.sql');
  assert.ok(fs.existsSync(sqlPath), `missing migration file: ${sqlPath}`);
  const sql = fs.readFileSync(sqlPath, 'utf8');
  assert.match(sql, /CREATE TABLE IF NOT EXISTS "accounts"/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS "sessions"/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS "verifications"/);
  assert.match(sql, /accounts_user_id_users_id_fk/);
  assert.match(sql, /sessions_user_id_users_id_fk/);
});
