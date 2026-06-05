export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import { ListTemplatesUseCase } from '@application/templates';
import { staticTemplateCatalog } from '@infrastructure/templates';
import { TemplateListResponseSchema } from '@repo/contracts/templates';
import { createLogger } from '@shared/observability/logger';
import { validationFailureData } from '@shared/observability/log-safe';
import { AnalyticsEvents } from '@infrastructure/analytics/analytics-events';
import { captureServer } from '@infrastructure/analytics/posthog-server';

const logger = createLogger({ operation: 'templates.list' });

export async function GET() {
  const userResult = await requireUser(await headers());
  if (userResult.isErr()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = userResult.unwrap().id;

  const useCase = new ListTemplatesUseCase(staticTemplateCatalog);
  const result = await useCase.execute();

  if (result.isErr()) {
    const e = result.error;
    logger.warn('List templates failed', { userId, statusCode: e.statusCode });
    return NextResponse.json({ error: e.message }, { status: e.statusCode });
  }

  const validated = TemplateListResponseSchema.safeParse(result.unwrap());
  if (!validated.success) {
    logger
      .withContext({ userId })
      .error('List templates outbound validation failed', validationFailureData(validated.error.flatten()));
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }

  captureServer(AnalyticsEvents.TEMPLATE_CATALOG_VIEWED, userId, {
    template_count: validated.data.length,
  });

  return NextResponse.json(validated.data);
}
