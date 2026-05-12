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
import {
  checkCreditsForApi as checkCredits,
  deductCreditsForApi as deductCredits,
} from '@infrastructure/http/credits-http-bridge';
import { ApplicationError } from '@shared/errors/application-error';

const FEATURE_SPLIT_CREDIT_COST = parseInt(
  process.env.CREDIT_COST_FEATURE_SPLIT ?? '5',
  10
);

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

  const creditCheck = await checkCredits(userId, 'feature_split');
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

  const deductResult = await deductCredits(userId, 'feature_split', {
    projectId: params.id,
    operation: 'feature_split_proposal',
  });

  const proposal = result.unwrap();
  const responsePayload = {
    proposal,
    creditsDeducted: deductResult.success ? FEATURE_SPLIT_CREDIT_COST : undefined,
  };

  const out = ProposeFeatureSplitResponseSchema.safeParse(responsePayload);
  if (!out.success) return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  return NextResponse.json(out.data);
}
