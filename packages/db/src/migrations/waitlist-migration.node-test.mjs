import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const migrationPath = resolve(
  process.cwd(),
  'src/migrations/0018_wellness_waitlist.sql'
);
const migration = readFileSync(migrationPath, 'utf8');

test('0018 creates the qualified waitlist lead store', () => {
  assert.match(migration, /CREATE TABLE IF NOT EXISTS "waitlist_leads"/);
  assert.match(migration, /"email" text NOT NULL/);
  assert.match(migration, /"consent_to_contact" boolean DEFAULT true NOT NULL/);
  assert.match(migration, /"qualified_at" timestamp/);
  assert.match(migration, /CREATE UNIQUE INDEX IF NOT EXISTS "waitlist_leads_email_unique"/);
});
