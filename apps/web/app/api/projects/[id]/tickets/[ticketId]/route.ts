export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import { TicketDTOSchema, UpdateTicketRequestSchema } from '@repo/contracts/tickets';
import { UpdateTicketUseCase, DeleteTicketUseCase } from '@application/tickets';
import { ticketDeps } from '../_lib/deps';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'ticket-detail' });

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; ticketId: string } },
) {
  try {
    const userResult = await requireUser(await headers());
    if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const parsed = UpdateTicketRequestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await new UpdateTicketUseCase(ticketDeps()).execute({
      projectId: params.id,
      ticketId: params.ticketId,
      userId: userResult.unwrap().id,
      patch: parsed.data,
    });
    if (result.isErr()) {
      return NextResponse.json({ error: result.error.message }, { status: result.error.statusCode });
    }
    return NextResponse.json({ ticket: TicketDTOSchema.parse(result.unwrap()) });
  } catch (error) {
    logger.withContext({ projectId: params.id }).error('Ticket PATCH failed', error);
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; ticketId: string } },
) {
  try {
    const userResult = await requireUser(await headers());
    if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const result = await new DeleteTicketUseCase(ticketDeps()).execute({
      projectId: params.id,
      ticketId: params.ticketId,
      userId: userResult.unwrap().id,
    });
    if (result.isErr()) {
      return NextResponse.json({ error: result.error.message }, { status: result.error.statusCode });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.withContext({ projectId: params.id }).error('Ticket DELETE failed', error);
    return NextResponse.json({ error: 'Failed to delete ticket' }, { status: 500 });
  }
}
