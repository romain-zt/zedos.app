export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import {
  GetGithubConnectionResponseSchema,
  GithubConnectionDTOSchema,
  type GithubConnectionDTO,
} from '@repo/contracts/github/connection';
import { ConnectGithubRepoUseCase } from '@application/github/connect-github-repo-usecase';
import { DisconnectGithubRepoUseCase } from '@application/github/disconnect-github-repo-usecase';
import { GetGithubConnectionUseCase } from '@application/github/get-github-connection-usecase';
import { DrizzleProjectRepository } from '@infrastructure/persistence/project-repository';
import { githubConnectionRepository } from '@infrastructure/persistence/github-connection-repository';
import type { GithubConnection } from '@domain/github';
import { createLogger } from '@shared/observability/logger';
import { validationFailureData } from '@shared/observability/log-safe';

const logger = createLogger({ operation: 'github-connection' });

function toDto(connection: GithubConnection): GithubConnectionDTO {
  return {
    id: connection.id,
    projectId: connection.projectId,
    ownerLogin: connection.ownerLogin,
    repoName: connection.repoName,
    installationId: connection.installationId,
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
    const useCase = new GetGithubConnectionUseCase(
      new DrizzleProjectRepository(),
      githubConnectionRepository,
    );
    const result = await useCase.execute(projectId, userResult.unwrap().id);
    if (result.isErr()) {
      return NextResponse.json({ error: result.error.message }, { status: result.error.statusCode });
    }
    const connection = result.unwrap();
    const payload = { connection: connection ? toDto(connection) : null };
    const validated = GetGithubConnectionResponseSchema.safeParse(payload);
    if (!validated.success) {
      logger
        .withContext({ projectId })
        .error('GitHub connection outbound validation failed', validationFailureData(validated.error.flatten()));
      return NextResponse.json({ error: 'Internal validation error' }, { status: 500 });
    }
    return NextResponse.json(validated.data);
  } catch (error) {
    logger.withContext({ projectId }).error('GitHub connection GET failed', error);
    return NextResponse.json({ error: 'Failed to load GitHub connection' }, { status: 500 });
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
    const useCase = new ConnectGithubRepoUseCase(
      new DrizzleProjectRepository(),
      githubConnectionRepository,
    );
    const result = await useCase.execute(projectId, userResult.unwrap().id, body);
    if (result.isErr()) {
      return NextResponse.json({ error: result.error.message }, { status: result.error.statusCode });
    }
    const dto = GithubConnectionDTOSchema.safeParse(toDto(result.unwrap()));
    if (!dto.success) {
      logger.withContext({ projectId }).error('GitHub connection DTO validation failed', validationFailureData(dto.error.flatten()));
      return NextResponse.json({ error: 'Internal validation error' }, { status: 500 });
    }
    return NextResponse.json(dto.data, { status: 201 });
  } catch (error) {
    logger.withContext({ projectId }).error('GitHub connection POST failed', error);
    return NextResponse.json({ error: 'Failed to connect GitHub' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const projectId = params.id;
  try {
    const userResult = await requireUser(await headers());
    if (userResult.isErr()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const useCase = new DisconnectGithubRepoUseCase(
      new DrizzleProjectRepository(),
      githubConnectionRepository,
    );
    const result = await useCase.execute(projectId, userResult.unwrap().id);
    if (result.isErr()) {
      return NextResponse.json({ error: result.error.message }, { status: result.error.statusCode });
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.withContext({ projectId }).error('GitHub connection DELETE failed', error);
    return NextResponse.json({ error: 'Failed to disconnect GitHub' }, { status: 500 });
  }
}
