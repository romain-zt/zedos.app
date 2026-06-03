export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import {
  AutoReloadPreferenceDTOSchema,
  UpdateAutoReloadPreferenceRequestSchema,
} from '@repo/contracts/payments';
import { GetAutoReloadPreferenceUseCase } from '@application/auto-reload/get-auto-reload-preference-usecase';
import { UpdateAutoReloadPreferenceUseCase } from '@application/auto-reload/update-auto-reload-preference-usecase';
import { DrizzleAutoReloadRepository } from '@infrastructure/persistence/auto-reload-repository';
import { toNextErrorResponse } from '@shared/http';
import { AnalyticsEvents } from '@infrastructure/analytics/analytics-events';
import { captureServer } from '@infrastructure/analytics/posthog-server';

const repo = new DrizzleAutoReloadRepository();

export async function GET() {
  const userResult = await requireUser(await headers());
  if (userResult.isErr()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await new GetAutoReloadPreferenceUseCase(repo).execute(userResult.unwrap().id);
  if (result.isErr()) {
    return toNextErrorResponse(result.error);
  }

  const parsed = AutoReloadPreferenceDTOSchema.safeParse(result.unwrap());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
  return NextResponse.json(parsed.data);
}

export async function PATCH(request: Request) {
  const userResult = await requireUser(await headers());
  if (userResult.isErr()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rawBody: unknown = await request.json();
  const parsedBody = UpdateAutoReloadPreferenceRequestSchema.safeParse(rawBody);
  if (!parsedBody.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsedBody.error.flatten() }, { status: 400 });
  }

  const patch = parsedBody.data;
  const result = await new UpdateAutoReloadPreferenceUseCase(repo).execute(userResult.unwrap().id, {
    enabled: patch.enabled,
    packSize: patch.packSize,
  });
  if (result.isErr()) {
    return toNextErrorResponse(result.error);
  }

  const parsed = AutoReloadPreferenceDTOSchema.safeParse(result.unwrap());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
  const userId = userResult.unwrap().id;
  if (patch.enabled === true) {
    captureServer(AnalyticsEvents.AUTO_RELOAD_ENABLED, userId, {
      pack_id: String(patch.packSize ?? parsed.data.packSize),
    });
  } else if (patch.enabled === false) {
    captureServer(AnalyticsEvents.AUTO_RELOAD_DISABLED, userId, {});
  }
  return NextResponse.json(parsed.data);
}
