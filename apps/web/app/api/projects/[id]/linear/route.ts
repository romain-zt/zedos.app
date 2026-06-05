export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import {
  GetLinearConnectionResponseSchema,
  LinearConnectionDTOSchema,
  type LinearConnectionDTO,
} from '@repo/contracts/linear/connection';
import { ConnectLinearUseCase } from '@application/linear/connect-linear-usecase';
import { DisconnectLinearUseCase } from '@application/linear/disconnect-linear-usecase';
import { GetLinearConnectionUseCase } from '@application/linear/get-linear-connection-usecase';
import { DrizzleProjectRepository } from '@infrastructure/persistence/project-repository';
import { linearConnectionRepository } from '@infrastructure/persistence/linear-connection-repository';
import type { LinearConnection } from '@domain/linear';
import { createLogger } from '@shared/observability/logger';
import { validationFailureData } from '@shared/observability/log-safe';

const logger = createLogger({ operation: 'linear-connection' });

function toDto(connection: LinearConnection): LinearConnectionDTO {
  return {
    id: connection.id,
    projectId: connection.projectId,
    teamId: connection.teamId,
    linearProjectId: connection.linearProjectId,
    status: connection.status,
    createdAt: connection.createdAt,
    disconnectedAt: connection.disconnectedAt,
  };
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const projectId = params.id;
  try {
    const userResult = await requireUser(await headers());
    if (userResult.isErr()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const useCase = new GetLinearConnectionUseCase(
      new DrizzleProjectRepository(),
      linearConnectionRepository,
    );
    const result = await useCase.execute(projectId, userResult.unwrap().id);
    if (result.isErr()) {
      return NextResponse.json({ error: result.error.message }, { status: result.error.statusCode });
    }
    const connection = result.unwrap();
    const payload = { connection: connection ? toDto(connection) : null };
    const validated = GetLinearConnectionResponseSchema.safeParse(payload);
    if (!validated.success) {
      logger
        .withContext({ projectId })
        .error('Linear connection outbound validation failed', validationFailureData(validated.error.flatten()));
      return NextResponse.json({ error: 'Internal validation error' }, { status: 500 });
    }
    return NextResponse.json(validated.data);
  } catch (error) {
    logger.withContext({ projectId }).error('Linear connection GET failed', error);
    return NextResponse.json({ error: 'Failed to load Linear connection' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const projectId = params.id;
  try {
    const userResult = await requireUser(await headers());
    if (userResult.isErr()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json().catch(() => null);
    const useCase = new ConnectLinearUseCase(
      new DrizzleProjectRepository(),
      linearConnectionRepository,
    );
    const result = await useCase.execute(projectId, userResult.unwrap().id, body);
    if (result.isErr()) {
      return NextResponse.json({ error: result.error.message }, { status: result.error.statusCode });
    }
    const dto = LinearConnectionDTOSchema.safeParse(toDto(result.unwrap()));
    if (!dto.success) {
      logger
        .withContext({ projectId })
        .error('Linear connection DTO validation failed', validationFailureData(dto.error.flatten()));
      return NextResponse.json({ error: 'Internal validation error' }, { status: 500 });
    }
    return NextResponse.json(dto.data, { status: 201 });
  } catch (error) {
    logger.withContext({ projectId }).error('Linear connection POST failed', error);
    return NextResponse.json({ error: 'Failed to connect Linear' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const projectId = params.id;
  try {
    const userResult = await requireUser(await headers());
    if (userResult.isErr()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const useCase = new DisconnectLinearUseCase(
      new DrizzleProjectRepository(),
      linearConnectionRepository,
    );
    const result = await useCase.execute(projectId, userResult.unwrap().id);
    if (result.isErr()) {
      return NextResponse.json({ error: result.error.message }, { status: result.error.statusCode });
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.withContext({ projectId }).error('Linear connection DELETE failed', error);
    return NextResponse.json({ error: 'Failed to disconnect Linear' }, { status: 500 });
  }
}
