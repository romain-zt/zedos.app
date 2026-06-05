export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import { ConversionGateResponseSchema } from '@repo/contracts/delivery';
import { EvaluateExportConversionGateUseCase } from '@application/delivery/evaluate-export-conversion-gate-usecase';
import { AnalyticsEvents } from '@infrastructure/analytics/analytics-events';
import { captureServer } from '@infrastructure/analytics/posthog-server';

const UPGRADE_PATH = '/dashboard/billing?upgrade=builder&source=export';

export async function GET() {
  const userResult = await requireUser(await headers());
  if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = userResult.unwrap().id;

  const result = await new EvaluateExportConversionGateUseCase().execute(userId);
  if (result.isErr()) {
    return NextResponse.json({ error: result.error.message }, { status: result.error.statusCode });
  }
  const gate = result.unwrap();

  if (gate.decision === 'soft-gate') {
    captureServer(AnalyticsEvents.CURSOR_EXPORT_GATE_SHOWN, userId, {
      plan_tier: gate.planTier,
      has_attempted_export: gate.hasAttemptedExport,
    });
  }

  const payload = ConversionGateResponseSchema.parse({
    decision: gate.decision,
    planTier: gate.planTier,
    hasAttemptedExport: gate.hasAttemptedExport,
    upgradeUrl: gate.decision === 'soft-gate' ? UPGRADE_PATH : null,
  });
  return NextResponse.json(payload);
}
