export const dynamic = 'force-dynamic';

import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import {
  WaitlistRequestSchema,
  type WaitlistContactRequest,
  type WaitlistQualificationRequest,
} from '@repo/contracts/marketing/waitlist';
import {
  QualifyWaitlistLeadUseCase,
  SubmitWaitlistContactUseCase,
} from '@application/waitlist/manage-waitlist-usecase';
import { DrizzleWaitlistRepository } from '@infrastructure/persistence/waitlist-repository';
import { AnalyticsEvents } from '@infrastructure/analytics/analytics-events';
import { captureServer } from '@infrastructure/analytics/posthog-server';
import { toNextErrorResponse } from '@shared/http';
import { createLogger } from '@shared/observability/logger';
import { validationFailureData } from '@shared/observability/log-safe';

const logger = createLogger({ operation: 'waitlist' });

function botAcceptedResponse(): NextResponse {
  return NextResponse.json(
    { leadId: randomUUID(), status: 'created' },
    { status: 202 }
  );
}

async function submitContact(input: WaitlistContactRequest): Promise<NextResponse> {
  if (input.websiteTrap) return botAcceptedResponse();

  const useCase = new SubmitWaitlistContactUseCase(
    new DrizzleWaitlistRepository()
  );
  const result = await useCase.execute(input);
  if (result.isErr()) return toNextErrorResponse(result.error);

  const response = result.unwrap();
  captureServer(
    AnalyticsEvents.WAITLIST_CONTACT_SUBMITTED,
    response.leadId,
    {
      business_type: input.businessType,
      has_website: Boolean(input.website),
      application_status: response.status,
    }
  );

  return NextResponse.json(response, {
    status: response.status === 'created' ? 201 : 200,
  });
}

async function submitQualification(
  input: WaitlistQualificationRequest
): Promise<NextResponse> {
  const useCase = new QualifyWaitlistLeadUseCase(
    new DrizzleWaitlistRepository()
  );
  const result = await useCase.execute(input);
  if (result.isErr()) return toNextErrorResponse(result.error);

  const response = result.unwrap();
  captureServer(
    AnalyticsEvents.WAITLIST_QUALIFICATION_SUBMITTED,
    response.leadId,
    {
      practitioner_range: input.practitionerRange,
      location_range: input.locationRange,
      launch_timeframe: input.launchTimeframe,
      challenge: input.mainChallenge,
    }
  );

  return NextResponse.json(response, { status: 200 });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json().catch(() => null);
    const parsed = WaitlistRequestSchema.safeParse(body);
    if (!parsed.success) {
      logger.warn(
        'Waitlist validation failed',
        validationFailureData(parsed.error.flatten())
      );
      return NextResponse.json(
        { error: 'Please check the highlighted fields and try again.' },
        { status: 400 }
      );
    }

    return parsed.data.stage === 'contact'
      ? submitContact(parsed.data)
      : submitQualification(parsed.data);
  } catch (error) {
    logger.error('Waitlist submission failed', error);
    return NextResponse.json(
      { error: 'We could not save your application. Please try again.' },
      { status: 500 }
    );
  }
}
