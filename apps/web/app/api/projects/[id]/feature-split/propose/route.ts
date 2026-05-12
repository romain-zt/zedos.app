export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import { DrizzleProjectRepository } from '@infrastructure/persistence/project-repository';
import { DrizzlePrdRepository } from '@infrastructure/persistence/prd-repository';
import { ProposeFeatureSplitUseCase } from '@application/feature-split/propose-feature-split-usecase';
import {
  ProposeFeatureSplitRequestSchema,
  ProposeFeatureSplitResponseSchema,
} from '@repo/contracts/ai/feature-split-proposal';
import { checkCredits, deductCredits, getCreditCost } from '@/lib/credits';
import { ApplicationError } from '@shared/errors/application-error';

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

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = ProposeFeatureSplitRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const creditCheck = await checkCredits(userId, 'feature_split_propose');
  if (!creditCheck.allowed) {
    return NextResponse.json(
      { error: 'insufficient_credits', message: creditCheck.reason, balance: creditCheck.currentBalance },
      { status: 402 }
    );
  }

  const useCase = new ProposeFeatureSplitUseCase(
    new DrizzleProjectRepository(),
    new DrizzlePrdRepository()
  );
  const result = await useCase.execute(params.id, userId, parsed.data.sourcePrdVersionId);
  if (result.isErr()) return toErrorResponse(result.error);

  const deductResult = await deductCredits(userId, 'feature_split_propose', {
    projectId: params.id,
    operation: 'feature_split_proposal',
  });

  const proposal = result.unwrap();
  const responsePayload = {
    proposal,
    creditsDeducted: deductResult.success ? getCreditCost('feature_split_propose') : undefined,
  };

  const out = ProposeFeatureSplitResponseSchema.safeParse(responsePayload);
  if (!out.success) return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  return NextResponse.json(out.data);
}
