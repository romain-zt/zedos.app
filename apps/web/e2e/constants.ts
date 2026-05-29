/** Fixed E2E identities — must match `scripts/seed-e2e.ts` */
export const E2E_USER_EMAIL = process.env.E2E_USER_EMAIL ?? 'e2e@zedos.test';
export const E2E_USER_PASSWORD = process.env.E2E_USER_PASSWORD ?? 'E2eTestPassword123!';
export const E2E_NO_CREDITS_EMAIL = process.env.E2E_NO_CREDITS_EMAIL ?? 'e2e-nocredits@zedos.test';
export const E2E_NO_CREDITS_PASSWORD = process.env.E2E_NO_CREDITS_PASSWORD ?? 'E2eTestPassword123!';

export const E2E_PROJECT_ID =
  process.env.E2E_PROJECT_ID ?? 'e2e00000-0000-4000-8000-000000000001';
export const E2E_PROJECT_NO_CREDITS_ID =
  process.env.E2E_PROJECT_NO_CREDITS_ID ?? 'e2e00000-0000-4000-8000-000000000002';

export const AUTH_STORAGE_PATH = 'e2e/.auth/user.json';
export const AUTH_NO_CREDITS_STORAGE_PATH = 'e2e/.auth/user-no-credits.json';
