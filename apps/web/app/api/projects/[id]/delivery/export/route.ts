export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import { DeliveryExportRequestSchema } from '@repo/contracts/delivery';
import { ExportGatedErrorSchema } from '@repo/contracts/delivery/conversion-gate';
import { BuildDeliveryPackageUseCase } from '@application/delivery/build-delivery-package-usecase';
import { EvaluateExportConversionGateUseCase } from '@application/delivery/evaluate-export-conversion-gate-usecase';
import { DrizzleProjectRepository } from '@infrastructure/persistence/project-repository';
import { DrizzleDeliveryExportRepository } from '@infrastructure/delivery/delivery-export-repository';
import { CursorPackageAssembler } from '@infrastructure/delivery/cursor-package-assembler';
import { decisionGraphRepository } from '@infrastructure/persistence/decision-graph-repository';
import { DrizzlePlanTierReader } from '@infrastructure/persistence/plan-tier-reader';
import { ApplicationError } from '@shared/errors/application-error';
import { createLogger } from '@shared/observability/logger';
import { validationFailureData } from '@shared/observability/log-safe';
import { AnalyticsEvents } from '@infrastructure/analytics/analytics-events';
import { captureServer } from '@infrastructure/analytics/posthog-server';

const logger = createLogger({ operation: 'delivery-export' });
const UPGRADE_PATH = '/dashboard/billing?upgrade=builder&source=export';

function toErrorResponse(e: ApplicationError) {
  return NextResponse.json({ error: e.message }, { status: e.statusCode });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userResult = await requireUser(await headers());
  if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = userResult.unwrap().id;

  const gateResult = await new EvaluateExportConversionGateUseCase().execute(userId);
  if (gateResult.isErr()) return toErrorResponse(gateResult.error);
  const gate = gateResult.unwrap();
  if (gate.decision === 'soft-gate') {
    captureServer(AnalyticsEvents.CURSOR_EXPORT_GATE_SHOWN, userId, {
      plan_tier: gate.planTier,
      has_attempted_export: gate.hasAttemptedExport,
      surface: 'export_attempt',
    });
    const body = ExportGatedErrorSchema.parse({
      error: 'export_gated',
      decision: 'soft-gate',
      planTier: gate.planTier,
      hasAttemptedExport: gate.hasAttemptedExport,
      upgradeUrl: UPGRADE_PATH,
      message: 'Cursor export requires Builder. Preview the package or upgrade to download the full zip.',
    });
    return NextResponse.json(body, { status: 402 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = DeliveryExportRequestSchema.safeParse(raw);
  if (!parsed.success) {
    logger.warn('Delivery export validation failed', validationFailureData(parsed.error.flatten()));
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const useCase = new BuildDeliveryPackageUseCase(
    new DrizzleProjectRepository(),
    new DrizzleDeliveryExportRepository(),
    new CursorPackageAssembler(),
    decisionGraphRepository,
  );
  const result = await useCase.execute(params.id, userId, parsed.data.bundleIds);
  if (result.isErr()) {
    logger.warn('Delivery export failed', {
      projectId: params.id,
      userId,
      statusCode: result.error.statusCode,
    });
    return toErrorResponse(result.error);
  }

  const build = result.unwrap();
  await new DrizzlePlanTierReader().markExportAttempted(userId);
  captureServer(AnalyticsEvents.CURSOR_EXPORT_COMPLETED, userId, {
    plan_tier: gate.planTier,
    project_id: params.id,
    bundle_count: parsed.data.bundleIds.length,
    zip_bytes: build.zipBuffer.length,
  });
  logger.info('Delivery export succeeded', {
    projectId: params.id,
    userId,
    bundleCount: parsed.data.bundleIds.length,
    zipBytes: build.zipBuffer.length,
  });
  return new NextResponse(build.zipBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${build.filename}"`,
      'Content-Length': String(build.zipBuffer.length),
    },
  });
}
