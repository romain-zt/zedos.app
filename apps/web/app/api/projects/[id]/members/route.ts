export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import {
  InviteProjectMemberRequestSchema,
  ProjectMemberListResponseSchema,
  ProjectMemberDTOSchema,
} from '@repo/contracts/project/members';
import { DrizzleProjectMemberRepository } from '@infrastructure/persistence/project-member-repository';
import { InviteCommenterUseCase } from '@application/collab/invite-commenter-usecase';
import { validationFailureData } from '@shared/observability/log-safe';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'project-members' });
const repo = new DrizzleProjectMemberRepository();

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const userResult = await requireUser(await headers());
  if (userResult.isErr()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await repo.listByProject(params.id, userResult.unwrap().id);
  if (result.isErr()) {
    return NextResponse.json({ error: result.error.message }, { status: result.error.statusCode });
  }

  const out = ProjectMemberListResponseSchema.safeParse({ members: result.unwrap() });
  if (!out.success) {
    logger.error('Members list outbound validation failed', validationFailureData(out.error.flatten()));
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }

  return NextResponse.json(out.data);
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const userResult = await requireUser(await headers());
  if (userResult.isErr()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = InviteProjectMemberRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const ownerId = userResult.unwrap().id;
  const { inviteEmail, role } = parsed.data;

  if (role === 'commenter') {
    const useCase = new InviteCommenterUseCase(repo);
    const result = await useCase.execute({
      projectId: params.id,
      ownerUserId: ownerId,
      inviteEmail,
    });
    if (result.isErr()) {
      return NextResponse.json({ error: result.error.message }, { status: result.error.statusCode });
    }
    const out = ProjectMemberDTOSchema.safeParse(result.unwrap());
    if (!out.success) {
      logger.error('Commenter invite outbound validation failed', validationFailureData(out.error.flatten()));
      return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
    return NextResponse.json(out.data, { status: 201 });
  }

  const result = await repo.invite(params.id, ownerId, inviteEmail, role);
  if (result.isErr()) {
    return NextResponse.json({ error: result.error.message }, { status: result.error.statusCode });
  }

  const out = ProjectMemberDTOSchema.safeParse(result.unwrap());
  if (!out.success) {
    logger.error('Member invite outbound validation failed', validationFailureData(out.error.flatten()));
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }

  return NextResponse.json(out.data, { status: 201 });
}
