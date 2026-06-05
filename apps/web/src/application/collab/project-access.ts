import { Result, err, ok } from '@repo/result';
import { ApplicationError, ForbiddenError, NotFoundError } from '@shared/errors/application-error';
import type { IProjectRepository } from '@domain/project/project-repository';
import type { IProjectMemberRepository } from '@domain/collab/project-member-repository';

export type ProjectAccessRole = 'owner' | 'member';

export interface ProjectAccessContext {
  projectId: string;
  userId: string;
  role: ProjectAccessRole;
}

/**
 * Resolves the user's relationship to a project for collab operations.
 *
 * - Returns `role: 'owner'` if the user owns the project.
 * - Returns `role: 'member'` if the user is an active member (any non-owner role).
 * - Returns NotFoundError otherwise — never leaks project existence.
 */
export async function resolveProjectAccess(
  projectId: string,
  userId: string,
  projectRepository: IProjectRepository,
  memberRepository: IProjectMemberRepository,
): Promise<Result<ProjectAccessContext, ApplicationError>> {
  const projectResult = await projectRepository.findById(projectId);
  if (projectResult.isErr()) return err(projectResult.error);

  const project = projectResult.unwrap();
  if (project.userId === userId) {
    return ok({ projectId, userId, role: 'owner' });
  }

  const hasAccess = await memberRepository.userHasProjectAccess(projectId, userId);
  if (!hasAccess) {
    return err(new NotFoundError('Project not found'));
  }

  return ok({ projectId, userId, role: 'member' });
}

/** Narrows access to owner-only operations. */
export function requireOwnerAccess(
  ctx: ProjectAccessContext,
): Result<ProjectAccessContext, ApplicationError> {
  if (ctx.role !== 'owner') {
    return err(new ForbiddenError('Owner-only operation'));
  }
  return ok(ctx);
}
