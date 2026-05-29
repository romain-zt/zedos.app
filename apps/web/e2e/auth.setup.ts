import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { test as setup, expect } from '@playwright/test';
import {
  AUTH_NO_CREDITS_STORAGE_PATH,
  AUTH_STORAGE_PATH,
  E2E_NO_CREDITS_EMAIL,
  E2E_NO_CREDITS_PASSWORD,
  E2E_USER_EMAIL,
  E2E_USER_PASSWORD,
} from './constants';

async function signInViaApi(
  request: import('@playwright/test').APIRequestContext,
  email: string,
  password: string,
  storagePath: string,
): Promise<void> {
  const response = await request.post('/api/auth/sign-in/email', {
    data: { email, password },
  });
  expect(response.ok(), `sign-in failed for ${email}: ${response.status()}`).toBeTruthy();

  await mkdir(dirname(storagePath), { recursive: true });
  await request.storageState({ path: storagePath });
}

setup('authenticate main E2E user', async ({ request }) => {
  await signInViaApi(request, E2E_USER_EMAIL, E2E_USER_PASSWORD, AUTH_STORAGE_PATH);
});

setup('authenticate no-credits E2E user', async ({ request }) => {
  await signInViaApi(
    request,
    E2E_NO_CREDITS_EMAIL,
    E2E_NO_CREDITS_PASSWORD,
    AUTH_NO_CREDITS_STORAGE_PATH,
  );
});
