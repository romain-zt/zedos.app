import { defineConfig } from 'drizzle-kit';
import { loadDatabaseUrl } from './scripts/database-url.mjs';

const { url: databaseUrl } = loadDatabaseUrl();

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './src/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
});
