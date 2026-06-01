import assert from 'node:assert';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';

const packageRoot = resolve(import.meta.dirname, '..');
const migrationsFolder = join(packageRoot, 'src/migrations');

test('0010_confused_darkhawk hash is not satisfied by stale journal rows alone', () => {
  const query = readFileSync(join(migrationsFolder, '0010_confused_darkhawk.sql'), 'utf8');
  const hash = createHash('sha256').update(query).digest('hex');

  const staleHashes = [
    'f5d0b563b268f9e965994034493341f5f275877ba35fa680c69456a004d380ff',
    '7420ba16dd8fff2606e9ce5f11a9c5457d9046114e8cf07f33199c27ee8f4ac5',
  ];

  assert.equal(staleHashes.includes(hash), false);
});

test('0010 journal when is after 0009 so timestamp-based migrators can apply it', () => {
  const journal = JSON.parse(
    readFileSync(join(migrationsFolder, 'meta/_journal.json'), 'utf8'),
  );
  const entry0009 = journal.entries.find((entry) => entry.tag === '0009_account_settings_consents');
  const entry0010 = journal.entries.find((entry) => entry.tag === '0010_confused_darkhawk');

  assert.ok(entry0009);
  assert.ok(entry0010);
  assert.ok(entry0010.when > entry0009.when);
});
