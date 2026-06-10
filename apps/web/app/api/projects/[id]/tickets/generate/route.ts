export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import { GenerateTicketsResponseSchema } from '@repo/contracts/tickets';
import { GenerateTicketsUseCase } from '@application/tickets';
import { ticketRepository } from '@infrastructure/persistence/ticket-repository';
import { ticketSeedSourceReader } from '@infrastructure/persistence/ticket-seed-source-reader';
import { agentActivityRepository } from '@infrastructure/persistence/agent-activity-repository';
import { DrizzleProjectRepository } from '@infrastructure/persistence/project-repository';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'tickets-generate' });

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userResult = await requireUser(await headers());
    if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const useCase = new GenerateTicketsUseCase(
      new DrizzleProjectRepository(),
      ticketRepository,
      ticketSeedSourceReader,
      agentActivityRepository,
    );
    const result = await useCase.execute({ projectId: params.id, userId: userResult.unwrap().id });
    if (result.isErr()) {
      return NextResponse.json({ error: result.error.message }, { status: result.error.statusCode });
    }

    const { created, skipped } = result.unwrap();
    const out = GenerateTicketsResponseSchema.safeParse({
      created: created.length,
      skipped,
      tickets: created,
    });
    if (!out.success) {
      logger.withContext({ projectId: params.id }).error('Generate tickets outbound validation failed');
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
    return NextResponse.json(out.data);
  } catch (error) {
    logger.withContext({ projectId: params.id }).error('Tickets generate failed', error);
    return NextResponse.json({ error: 'Failed to generate tickets' }, { status: 500 });
  }
}
