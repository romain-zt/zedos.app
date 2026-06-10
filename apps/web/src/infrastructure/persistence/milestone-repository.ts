import { Result, ok, err } from '@repo/result';
import {
  ApplicationError,
  DatabaseError,
  NotFoundError,
} from '@shared/errors/application-error';
import {
  MilestoneDTOSchema,
  type CreateMilestoneRequest,
  type MilestoneDTO,
  type UpdateMilestoneRequest,
} from '@repo/contracts/planning';
import type { IMilestoneRepository } from '@domain/planning/milestone-repository';
import type { PlannedMilestoneDraft } from '@domain/planning/distribute-plan';
import {
  db,
  milestones,
  eq,
  and,
  asc,
  type NewMilestoneRow,
  type MilestoneUpdate,
} from '@repo/db';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ service: 'MilestoneRepository' });

function mapRow(row: typeof milestones.$inferSelect): MilestoneDTO | null {
  const parsed = MilestoneDTOSchema.safeParse({
    id: row.id,
    projectId: row.projectId,
    title: row.title,
    description: row.description,
    startsOn: row.startsOn,
    dueOn: row.dueOn,
    color: row.color,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
  if (!parsed.success) {
    logger.error('Milestone row failed DTO validation', { milestoneId: row.id });
    return null;
  }
  return parsed.data;
}

export class DrizzleMilestoneRepository implements IMilestoneRepository {
  async listByProject(projectId: string): Promise<Result<MilestoneDTO[], ApplicationError>> {
    try {
      const rows = await db
        .select()
        .from(milestones)
        .where(eq(milestones.projectId, projectId))
        .orderBy(asc(milestones.sortOrder), asc(milestones.startsOn));
      const dtos: MilestoneDTO[] = [];
      for (const row of rows) {
        const dto = mapRow(row);
        if (dto) dtos.push(dto);
      }
      return ok(dtos);
    } catch (error) {
      logger.error('Failed to list milestones', error);
      return err(new DatabaseError('Failed to list milestones'));
    }
  }

  async create(
    projectId: string,
    input: CreateMilestoneRequest,
  ): Promise<Result<MilestoneDTO, ApplicationError>> {
    try {
      const insertRow: NewMilestoneRow = {
        projectId,
        title: input.title,
        description: input.description ?? null,
        startsOn: input.startsOn ?? null,
        dueOn: input.dueOn ?? null,
        color: input.color ?? null,
        updatedAt: new Date(),
      };
      const [row] = await db.insert(milestones).values(insertRow).returning();
      const dto = row ? mapRow(row) : null;
      if (!dto) return err(new DatabaseError('Failed to create milestone'));
      return ok(dto);
    } catch (error) {
      logger.error('Failed to create milestone', error);
      return err(new DatabaseError('Failed to create milestone'));
    }
  }

  async createMany(
    projectId: string,
    drafts: PlannedMilestoneDraft[],
  ): Promise<Result<MilestoneDTO[], ApplicationError>> {
    if (drafts.length === 0) return ok([]);
    try {
      const created = await db.transaction(async (tx) => {
        const rows: (typeof milestones.$inferSelect)[] = [];
        for (const draft of drafts) {
          const insertRow: NewMilestoneRow = {
            projectId,
            title: draft.title,
            description: draft.description,
            startsOn: draft.startsOn,
            dueOn: draft.dueOn,
            color: draft.color,
            sortOrder: draft.sortOrder,
            updatedAt: new Date(),
          };
          const [row] = await tx.insert(milestones).values(insertRow).returning();
          if (row) rows.push(row);
        }
        return rows;
      });
      const dtos: MilestoneDTO[] = [];
      for (const row of created) {
        const dto = mapRow(row);
        if (dto) dtos.push(dto);
      }
      return ok(dtos);
    } catch (error) {
      logger.error('Failed to bulk-create milestones', error);
      return err(new DatabaseError('Failed to create milestones'));
    }
  }

  async update(
    milestoneId: string,
    projectId: string,
    patch: UpdateMilestoneRequest,
  ): Promise<Result<MilestoneDTO, ApplicationError>> {
    try {
      const update: MilestoneUpdate = { ...patch, updatedAt: new Date() };
      const [row] = await db
        .update(milestones)
        .set(update)
        .where(and(eq(milestones.id, milestoneId), eq(milestones.projectId, projectId)))
        .returning();
      if (!row) return err(new NotFoundError('Milestone not found'));
      const dto = mapRow(row);
      if (!dto) return err(new DatabaseError('Failed to update milestone'));
      return ok(dto);
    } catch (error) {
      logger.error('Failed to update milestone', error);
      return err(new DatabaseError('Failed to update milestone'));
    }
  }

  async delete(milestoneId: string, projectId: string): Promise<Result<void, ApplicationError>> {
    try {
      const deleted = await db
        .delete(milestones)
        .where(and(eq(milestones.id, milestoneId), eq(milestones.projectId, projectId)))
        .returning({ id: milestones.id });
      if (deleted.length === 0) return err(new NotFoundError('Milestone not found'));
      return ok(undefined);
    } catch (error) {
      logger.error('Failed to delete milestone', error);
      return err(new DatabaseError('Failed to delete milestone'));
    }
  }
}

export const milestoneRepository = new DrizzleMilestoneRepository();
