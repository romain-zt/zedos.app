export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import { PRD_SECTIONS } from '@repo/contracts/questions/history';
import {
  DecisionListResponseSchema,
  type DecisionDTO,
} from '@repo/contracts/decisions/decision';
import { ListDecisionsForProjectUseCase } from '@application/decision-graph/list-decisions-for-project-usecase';
import { DrizzleProjectRepository } from '@infrastructure/persistence/project-repository';
import { decisionGraphRepository } from '@infrastructure/persistence/decision-graph-repository';
import type { Decision } from '@domain/decision-graph/decision';
import { createLogger } from '@shared/observability/logger';
import { validationFailureData } from '@shared/observability/log-safe';

const logger = createLogger({ operation: 'decisions-list' });

function toDecisionDto(decision: Decision): DecisionDTO {
  return {
    id: decision.id,
    projectId: decision.projectId,
    prdVersionId: decision.prdVersionId,
    questionHistoryId: decision.questionHistoryId,
    structuredQuestion: decision.structuredQuestion,
    chosenOption: decision.chosenOption,
    rejectedOptions: decision.rejectedOptions,
    ownerComment: decision.ownerComment,
    aiInterpretation: decision.aiInterpretation,
    sectionIds: decision.sectionIds,
    createdAt: decision.createdAt,
  };
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const projectId = params.id;
  let userId: string | undefined;

  try {
    const userResult = await requireUser(await headers());
    if (userResult.isErr()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    userId = userResult.unwrap().id;

    const sectionParam = request.nextUrl.searchParams.get('section');
    const sectionFilter =
      sectionParam && (PRD_SECTIONS as readonly string[]).includes(sectionParam)
        ? (sectionParam as (typeof PRD_SECTIONS)[number])
        : undefined;

    const useCase = new ListDecisionsForProjectUseCase(
      new DrizzleProjectRepository(),
      decisionGraphRepository,
    );
    const result = await useCase.execute(projectId, userId, sectionFilter);
    if (result.isErr()) {
      const error = result.error;
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    const payload = result.unwrap().map(toDecisionDto);
    const validated = DecisionListResponseSchema.safeParse(payload);
    if (!validated.success) {
      logger
        .withContext({ projectId, userId })
        .error('Decisions outbound validation failed', validationFailureData(validated.error.flatten()));
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json(validated.data);
  } catch (error) {
    logger.withContext({ projectId, userId }).error('Decisions GET failed', error);
    return NextResponse.json({ error: 'Failed to fetch decisions' }, { status: 500 });
  }
}
