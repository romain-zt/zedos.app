export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import { db, projects, questionHistory, eq, and, asc } from '@repo/db';
import { QuestionHistoryRowSchema } from '@repo/contracts/questions/history';
import { BackfillDecisionsResponseSchema } from '@repo/contracts/decisions/decision';
import { backfillDecisionsForProjectUseCase } from '@application/decision-graph/backfill-decisions-for-project-usecase';
import { decisionGraphRepository } from '@infrastructure/persistence/decision-graph-repository';
import { createLogger } from '@shared/observability/logger';
import { validationFailureData } from '@shared/observability/log-safe';

const logger = createLogger({ operation: 'decision-graph-backfill' });

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const projectId = params.id;
  let userId: string | undefined;

  try {
    const userResult = await requireUser(await headers());
    if (userResult.isErr()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    userId = userResult.unwrap().id;

    const [project] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
      .limit(1);

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const rows = await db
      .select()
      .from(questionHistory)
      .where(eq(questionHistory.projectId, projectId))
      .orderBy(asc(questionHistory.createdAt));

    const historyRows = rows
      .map((row) => ({
        id: row.id,
        projectId: row.projectId,
        prdVersionId: row.prdVersionId ?? null,
        structuredQuestion: row.structuredQuestion,
        availableOptions: row.availableOptions,
        founderAnswer: row.founderAnswer ?? null,
        optionalComment: row.optionalComment ?? null,
        aiInterpretation: row.aiInterpretation ?? null,
        prdImpact: row.prdImpact ?? null,
        questionType: row.questionType,
        createdAt: row.createdAt,
      }))
      .filter((row) => QuestionHistoryRowSchema.safeParse(row).success);

    const result = await backfillDecisionsForProjectUseCase(historyRows, decisionGraphRepository);
    if (result.isErr()) {
      const error = result.error;
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    const validated = BackfillDecisionsResponseSchema.safeParse(result.unwrap());
    if (!validated.success) {
      logger
        .withContext({ projectId, userId })
        .error('Backfill outbound validation failed', validationFailureData(validated.error.flatten()));
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json(validated.data);
  } catch (error) {
    logger.withContext({ projectId, userId }).error('Decision backfill failed', error);
    return NextResponse.json({ error: 'Backfill failed' }, { status: 500 });
  }
}
