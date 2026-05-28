import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export type TestDrizzleDb = PostgresJsDatabase<typeof schema>;

export function createTestDb(connectionString: string): {
  db: TestDrizzleDb;
  disconnect: () => Promise<void>;
} {
  const queryClient = postgres(connectionString, {
    max: 3,
    idle_timeout: 5,
    connect_timeout: 10,
  });
  const database = drizzle(queryClient, { schema });

  return {
    db: database,
    disconnect: async () => {
      await queryClient.end({ timeout: 5 });
    },
  };
}
