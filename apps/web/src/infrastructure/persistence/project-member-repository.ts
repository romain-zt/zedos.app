import {
  db,
  projectMembers,
  projects,
  users,
  eq,
  and,
} from '@repo/db';
import { Result, ok, err } from '@repo/result';
import {
  ApplicationError,
  DatabaseError,
  ValidationError,
  ForbiddenError,
  NotFoundError,
} from '@shared/errors/application-error';
import type { ProjectMemberDTO } from '@repo/contracts/project/members';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ service: 'ProjectMemberRepository' });

function mapRow(row: typeof projectMembers.$inferSelect): ProjectMemberDTO {
  return {
    id: row.id,
    projectId: row.projectId,
    userId: row.userId,
    inviteEmail: row.inviteEmail,
    role: row.role as ProjectMemberDTO['role'],
    status: row.status as ProjectMemberDTO['status'],
    createdAt: row.createdAt,
    acceptedAt: row.acceptedAt ?? null,
  };
}

export class DrizzleProjectMemberRepository {
  async userHasProjectAccess(projectId: string, userId: string): Promise<boolean> {
    const [owned] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
      .limit(1);
    if (owned) return true;

    const [member] = await db
      .select({ id: projectMembers.id })
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, userId),
          eq(projectMembers.status, 'active')
        )
      )
      .limit(1);
    return Boolean(member);
  }

  async assertOwner(projectId: string, userId: string): Promise<Result<void, ApplicationError>> {
    const [owned] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
      .limit(1);
    if (!owned) {
      return err(new ForbiddenError('Only the project owner can manage members'));
    }
    return ok(undefined);
  }

  async listByProject(
    projectId: string,
    requesterUserId: string
  ): Promise<Result<ProjectMemberDTO[], ApplicationError>> {
    try {
      const hasAccess = await this.userHasProjectAccess(projectId, requesterUserId);
      if (!hasAccess) {
        return err(new NotFoundError('Project not found'));
      }

      const rows = await db
        .select()
        .from(projectMembers)
        .where(eq(projectMembers.projectId, projectId));

      return ok(rows.map(mapRow));
    } catch (error) {
      logger.error('listByProject failed', error);
      return err(new DatabaseError('Failed to list project members'));
    }
  }

  async invite(
    projectId: string,
    ownerUserId: string,
    inviteEmail: string,
    role: 'editor' | 'viewer'
  ): Promise<Result<ProjectMemberDTO, ApplicationError>> {
    try {
      const ownerCheck = await this.assertOwner(projectId, ownerUserId);
      if (ownerCheck.isErr()) return err(ownerCheck.error);

      const normalized = inviteEmail.trim().toLowerCase();
      const [owner] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, ownerUserId))
        .limit(1);
      if (owner?.email?.toLowerCase() === normalized) {
        return err(new ValidationError('You are already the project owner'));
      }

      const [existing] = await db
        .select()
        .from(projectMembers)
        .where(
          and(eq(projectMembers.projectId, projectId), eq(projectMembers.inviteEmail, normalized))
        )
        .limit(1);
      if (existing) {
        return ok(mapRow(existing));
      }

      const [invitee] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, normalized))
        .limit(1);

      const memberInsert = {
        projectId,
        inviteEmail: normalized,
        role,
        status: invitee ? ('active' as const) : ('pending' as const),
        userId: invitee?.id ?? null,
        invitedByUserId: ownerUserId,
        acceptedAt: invitee ? new Date() : null,
      } as typeof projectMembers.$inferInsert;
      const [inserted] = await db.insert(projectMembers).values(memberInsert).returning();

      if (!inserted) {
        return err(new DatabaseError('Failed to invite member'));
      }

      return ok(mapRow(inserted));
    } catch (error) {
      logger.error('invite failed', error);
      return err(new DatabaseError('Failed to invite member'));
    }
  }
}
