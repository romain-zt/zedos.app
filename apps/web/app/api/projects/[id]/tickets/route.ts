export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import {
  CreateTicketRequestSchema,
  TicketDTOSchema,
  TicketListResponseSchema,
} from '@repo/contracts/tickets';
import { ListTicketsUseCase, CreateTicketUseCase } from '@application/tickets';
import { ticketDeps } from './_lib/deps';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'tickets' });

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userResult = await requireUser(await headers());
    if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const result = await new ListTicketsUseCase(ticketDeps()).execute({
      projectId: params.id,
      userId: userResult.unwrap().id,
    });
    if (result.isErr()) {
      return NextResponse.json({ error: result.error.message }, { status: result.error.statusCode });
    }
    const out = TicketListResponseSchema.safeParse({ tickets: result.unwrap() });
    if (!out.success) {
      logger.withContext({ projectId: params.id }).error('Tickets outbound validation failed');
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
    return NextResponse.json(out.data);
  } catch (error) {
    logger.withContext({ projectId: params.id }).error('Tickets GET failed', error);
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userResult = await requireUser(await headers());
    if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const parsed = CreateTicketRequestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await new CreateTicketUseCase(ticketDeps()).execute({
      projectId: params.id,
      userId: userResult.unwrap().id,
      ticket: parsed.data,
    });
    if (result.isErr()) {
      return NextResponse.json({ error: result.error.message }, { status: result.error.statusCode });
    }
    return NextResponse.json({ ticket: TicketDTOSchema.parse(result.unwrap()) }, { status: 201 });
  } catch (error) {
    logger.withContext({ projectId: params.id }).error('Tickets POST failed', error);
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
  }
}
