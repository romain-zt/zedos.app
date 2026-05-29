/**
 * Seeds deterministic users + projects for Playwright E2E.
 * Run after migrations: `pnpm --filter @repo/web e2e:seed`
 */

import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { eq, sql, inArray } from 'drizzle-orm';
import {
  createTestDb,
  closeDatabaseConnections,
  projects,
  questionHistory,
  users,
  type NewProjectRow,
} from '@repo/db';
import { auth } from '@repo/auth/server';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

for (const envFile of ['.env.local', '.env']) {
  const envPath = resolve(webRoot, envFile);
  if (existsSync(envPath)) {
    config({ path: envPath });
  }
}

const databaseUrl =
  process.env.DATABASE_URL ??
  process.env.TEST_DATABASE_URL ??
  'postgresql://zedos_test:zedos_test@localhost:5433/zedos_test';

process.env.DATABASE_URL = databaseUrl;
const e2eBaseUrl =
  process.env.PLAYWRIGHT_BASE_URL ??
  process.env.BETTER_AUTH_URL ??
  (process.env.CI ? 'http://127.0.0.1:3000' : 'http://127.0.0.1:3001');
process.env.BETTER_AUTH_URL = e2eBaseUrl;
process.env.NEXT_PUBLIC_APP_URL = e2eBaseUrl;
process.env.BETTER_AUTH_SECRET =
  process.env.BETTER_AUTH_SECRET ?? 'e2e-better-auth-secret-min-32-chars-long';
process.env.NEXTAUTH_SECRET =
  process.env.NEXTAUTH_SECRET ?? 'e2e-nextauth-secret-min-32-chars';

const E2E_USER_EMAIL = process.env.E2E_USER_EMAIL ?? 'e2e@zedos.test';
const E2E_USER_PASSWORD = process.env.E2E_USER_PASSWORD ?? 'E2eTestPassword123!';
const E2E_NO_CREDITS_EMAIL = process.env.E2E_NO_CREDITS_EMAIL ?? 'e2e-nocredits@zedos.test';
const E2E_NO_CREDITS_PASSWORD = process.env.E2E_NO_CREDITS_PASSWORD ?? 'E2eTestPassword123!';

const E2E_PROJECT_ID = process.env.E2E_PROJECT_ID ?? 'e2e00000-0000-4000-8000-000000000001';
const E2E_PROJECT_NO_CREDITS_ID =
  process.env.E2E_PROJECT_NO_CREDITS_ID ?? 'e2e00000-0000-4000-8000-000000000002';

const E2E_EMAILS = [E2E_USER_EMAIL, E2E_NO_CREDITS_EMAIL];

const migrationsFolder = resolve(webRoot, '../../packages/db/src/migrations');

async function ensureBetterAuthUser(
  email: string,
  password: string,
  name: string,
): Promise<string> {
  const created = await auth.api.signUpEmail({
    body: { email, password, name },
  });

  if (created.user?.id) {
    return created.user.id;
  }

  throw new Error(`Failed to sign up E2E user ${email}`);
}

async function seedClarificationHistory(
  db: ReturnType<typeof createTestDb>['db'],
  projectId: string,
): Promise<void> {
  await db.delete(questionHistory).where(eq(questionHistory.projectId, projectId));

  await db.insert(questionHistory).values([
    {
      projectId,
      structuredQuestion: 'What problem does your product solve?',
      founderAnswer: 'Helps founders turn ideas into structured PRDs.',
      aiInterpretation: 'Clear problem statement for vision section.',
      prdImpact: 'vision',
      questionType: 'clarification',
    },
    {
      projectId,
      structuredQuestion: 'Who is the primary user?',
      founderAnswer: 'Solo founders and small product teams.',
      aiInterpretation: 'Target users identified.',
      prdImpact: 'target_users',
      questionType: 'clarification',
    },
  ]);
}

async function upsertProject(
  db: ReturnType<typeof createTestDb>['db'],
  project: NewProjectRow,
): Promise<void> {
  await db
    .insert(projects)
    .values(project)
    .onConflictDoUpdate({
      target: projects.id,
      set: {
        name: project.name,
        description: project.description,
        userId: project.userId,
      },
    });
}

async function main(): Promise<void> {
  const connection = createTestDb(databaseUrl);
  const { db, disconnect } = connection;

  await migrate(db, { migrationsFolder });

  await db.delete(users).where(inArray(users.email, E2E_EMAILS));

  const mainUserId = await ensureBetterAuthUser(
    E2E_USER_EMAIL,
    E2E_USER_PASSWORD,
    'E2E Main User',
  );
  const noCreditsUserId = await ensureBetterAuthUser(
    E2E_NO_CREDITS_EMAIL,
    E2E_NO_CREDITS_PASSWORD,
    'E2E No Credits User',
  );

  await db.update(users).set({ creditBalance: 100 }).where(eq(users.id, mainUserId));
  await db.update(users).set({ creditBalance: 0 }).where(eq(users.id, noCreditsUserId));

  await upsertProject(db, {
    id: E2E_PROJECT_ID,
    userId: mainUserId,
    name: 'E2E PRD Project',
    description: 'Playwright fixture project',
    phase: 'intake',
  });
  await upsertProject(db, {
    id: E2E_PROJECT_NO_CREDITS_ID,
    userId: noCreditsUserId,
    name: 'E2E No Credits Project',
    description: 'Insufficient credits scenarios',
    phase: 'intake',
  });

  await seedClarificationHistory(db, E2E_PROJECT_ID);
  await seedClarificationHistory(db, E2E_PROJECT_NO_CREDITS_ID);

  await disconnect();
  await closeDatabaseConnections();

  console.log('E2E seed completed:', {
    mainUserId,
    noCreditsUserId,
    E2E_PROJECT_ID,
    E2E_PROJECT_NO_CREDITS_ID,
  });
}

main().catch((error: unknown) => {
  console.error('E2E seed failed:', error);
  process.exit(1);
});
