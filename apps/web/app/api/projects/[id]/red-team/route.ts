export const dynamic = 'force-dynamic';
export const maxDuration = 180;

import { NextResponse, type NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import { requireUser } from '@repo/auth/guards';
import {
  CreateRedTeamReportRequestSchema,
  RedTeamReportListResponseSchema,
  RedTeamReportDetailSchema,
  type RedTeamReportSummary,
} from '@repo/contracts/ai';
import { GenerateRedTeamReportUseCase } from '@application/red-team/generate-red-team-report-usecase';
import { ListRedTeamReportsUseCase } from '@application/red-team/list-red-team-reports-usecase';
import { DrizzleProjectRepository } from '@infrastructure/persistence/project-repository';
import { DrizzlePrdRepository } from '@infrastructure/persistence/prd-repository';
import { DrizzleRedTeamReportRepository } from '@infrastructure/persistence/red-team-report-repository';
import { DrizzleCreditsRepository } from '@infrastructure/persistence/credits-repository';
import { RedTeamReportGeneratorAdapter } from '@infrastructure/ai/red-team-report-generator-adapter';
import { AnalyticsEvents } from '@infrastructure/analytics/analytics-events';
import { captureServer } from '@infrastructure/analytics/posthog-server';
import { toRedTeamReportSummary, toRedTeamReportDetail } from './_mappers';

const ParamsSchema = z.object({ id: z.string().min(1) });

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const userResult = await requireUser(await headers());
  if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = userResult.unwrap().id;

  const params = ParamsSchema.safeParse(await context.params);
  if (!params.success) return NextResponse.json({ error: 'Invalid project id' }, { status: 400 });

  const bodyJson = (await request.json().catch(() => null)) as unknown;
  const bodyResult = CreateRedTeamReportRequestSchema.safeParse(bodyJson);
  if (!bodyResult.success) {
    return NextResponse.json(
      { error: 'Invalid request', issues: bodyResult.error.flatten() },
      { status: 400 },
    );
  }

  captureServer(AnalyticsEvents.RED_TEAM_REVIEW_STARTED, userId, {
    project_id: params.data.id,
    prd_version_id: bodyResult.data.prdVersionId,
  });

  const useCase = new GenerateRedTeamReportUseCase(
    new DrizzleProjectRepository(),
    new DrizzlePrdRepository(),
    new DrizzleRedTeamReportRepository(),
    new RedTeamReportGeneratorAdapter(),
    new DrizzleCreditsRepository(),
  );
  const result = await useCase.execute({
    projectId: params.data.id,
    prdVersionId: bodyResult.data.prdVersionId,
    userId,
  });

  if (result.isErr()) {
    captureServer(AnalyticsEvents.RED_TEAM_REVIEW_FAILED, userId, {
      project_id: params.data.id,
      prd_version_id: bodyResult.data.prdVersionId,
      reason: result.error.message,
    });
    return NextResponse.json(
      { error: result.error.message },
      { status: result.error.statusCode },
    );
  }

  const report = result.unwrap();
  captureServer(AnalyticsEvents.RED_TEAM_REVIEW_COMPLETED, userId, {
    project_id: params.data.id,
    report_id: report.id,
    finding_count: report.findingCount,
    status: report.status,
  });
  return NextResponse.json(RedTeamReportDetailSchema.parse(toRedTeamReportDetail(report)));
}

export async function GET(_request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const userResult = await requireUser(await headers());
  if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = userResult.unwrap().id;

  const params = ParamsSchema.safeParse(await context.params);
  if (!params.success) return NextResponse.json({ error: 'Invalid project id' }, { status: 400 });

  const useCase = new ListRedTeamReportsUseCase(
    new DrizzleProjectRepository(),
    new DrizzleRedTeamReportRepository(),
  );
  const result = await useCase.execute(params.data.id, userId);
  if (result.isErr()) {
    return NextResponse.json(
      { error: result.error.message },
      { status: result.error.statusCode },
    );
  }
  const reports: RedTeamReportSummary[] = result.unwrap().map(toRedTeamReportSummary);
  return NextResponse.json(RedTeamReportListResponseSchema.parse({ reports }));
}
