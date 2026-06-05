export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import { DrizzleProjectMemberRepository } from '@infrastructure/persistence/project-member-repository';
import { RevokeMemberUseCase } from '@application/collab/revoke-member-usecase';

const repo = new DrizzleProjectMemberRepository();

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; memberId: string } },
) {
  const userResult = await requireUser(await headers());
  if (userResult.isErr()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const useCase = new RevokeMemberUseCase(repo);
  const result = await useCase.execute({
    projectId: params.id,
    memberId: params.memberId,
    ownerUserId: userResult.unwrap().id,
  });
  if (result.isErr()) {
    return NextResponse.json({ error: result.error.message }, { status: result.error.statusCode });
  }

  return new NextResponse(null, { status: 204 });
}
