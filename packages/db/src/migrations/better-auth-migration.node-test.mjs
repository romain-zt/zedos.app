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

test('migration 0002 adds better-auth user columns on users', () => {
  const sqlPath = path.join(__dirname, '0002_better_auth_user_profile_fields.sql');
  assert.ok(fs.existsSync(sqlPath), `missing migration file: ${sqlPath}`);
  const sql = fs.readFileSync(sqlPath, 'utf8');
  assert.match(sql, /email_verified/i);
  assert.match(sql, /\bimage\b/i);
});

test('migration 0003 allows null password_hash for better-auth users', () => {
  const sqlPath = path.join(__dirname, '0003_users_password_hash_nullable.sql');
  assert.ok(fs.existsSync(sqlPath), `missing migration file: ${sqlPath}`);
  const sql = fs.readFileSync(sqlPath, 'utf8');
  assert.match(sql, /password_hash/i);
});

test('migration 0010 defines task split bundle and task tables', () => {
  const sqlPath = path.join(__dirname, '0010_task_split_tables.sql');
  assert.ok(fs.existsSync(sqlPath), `missing migration file: ${sqlPath}`);
  const sql = fs.readFileSync(sqlPath, 'utf8');
  assert.match(sql, /CREATE TABLE IF NOT EXISTS "task_split_bundles"/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS "task_split_tasks"/);
  assert.match(sql, /task_split_bundles_project_id_projects_id_fk/);
  assert.match(sql, /task_split_tasks_bundle_id_task_split_bundles_id_fk/);
});
