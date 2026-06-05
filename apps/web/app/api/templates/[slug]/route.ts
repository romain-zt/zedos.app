export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import { GetTemplateBySlugUseCase } from '@application/templates';
import { staticTemplateCatalog } from '@infrastructure/templates';
import {
  TemplateDetailDTOSchema,
  TemplateSlugSchema,
} from '@repo/contracts/templates';
import { createLogger } from '@shared/observability/logger';
import { validationFailureData } from '@shared/observability/log-safe';
import { AnalyticsEvents } from '@infrastructure/analytics/analytics-events';
import { captureServer } from '@infrastructure/analytics/posthog-server';

const logger = createLogger({ operation: 'templates.get' });

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const userResult = await requireUser(await headers());
  if (userResult.isErr()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = userResult.unwrap().id;

  const { slug: rawSlug } = await context.params;
  const slugParsed = TemplateSlugSchema.safeParse(rawSlug);
  if (!slugParsed.success) {
    return NextResponse.json({ error: 'Unknown template slug' }, { status: 404 });
  }

  const useCase = new GetTemplateBySlugUseCase(staticTemplateCatalog);
  const result = await useCase.execute(slugParsed.data);

  if (result.isErr()) {
    const e = result.error;
    logger.warn('Get template failed', { userId, slug: slugParsed.data, statusCode: e.statusCode });
    return NextResponse.json({ error: e.message }, { status: e.statusCode });
  }

  const validated = TemplateDetailDTOSchema.safeParse(result.unwrap());
  if (!validated.success) {
    logger
      .withContext({ userId, slug: slugParsed.data })
      .error('Get template outbound validation failed', validationFailureData(validated.error.flatten()));
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }

  captureServer(AnalyticsEvents.TEMPLATE_PREVIEW_OPENED, userId, {
    template_slug: slugParsed.data,
  });

  return NextResponse.json(validated.data);
}
