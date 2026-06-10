import { Result, ok, err } from '@repo/result';
import { ApplicationError, DatabaseError } from '@shared/errors/application-error';
import {
  AgentActivityDTOSchema,
  TeamPlanSchema,
  type AgentActivityDTO,
  type TeamPlan,
  type TeamPlanDTO,
} from '@repo/contracts/team';
import type {
  IAgentActivityRepository,
  ITeamPlanRepository,
  StartAgentActivityInput,
  CompleteAgentActivityInput,
} from '@domain/team/team-repository';
import {
  db,
  agentActivities,
  teamPlans,
  eq,
  desc,
  type NewAgentActivityRow,
  type AgentActivityUpdate,
  type NewTeamPlanRow,
  type TeamPlanUpdate,
} from '@repo/db';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ service: 'AgentActivityRepository' });

function mapActivityRow(row: typeof agentActivities.$inferSelect): AgentActivityDTO | null {
  const parsed = AgentActivityDTOSchema.safeParse({
    id: row.id,
    projectId: row.projectId,
    agentRole: row.agentRole,
    kind: row.kind,
    status: row.status,
    summary: row.summary,
    createdAt: row.createdAt,
    completedAt: row.completedAt,
  });
  return parsed.success ? parsed.data : null;
}

export class DrizzleAgentActivityRepository implements IAgentActivityRepository {
  async start(
    input: StartAgentActivityInput,
  ): Promise<Result<AgentActivityDTO, ApplicationError>> {
    try {
      const insertRow: NewAgentActivityRow = {
        projectId: input.projectId,
        agentRole: input.agentRole,
        kind: input.kind,
        status: 'running',
        summary: input.summary,
        payload: input.payload ?? null,
      };
      const [row] = await db.insert(agentActivities).values(insertRow).returning();
      const dto = row ? mapActivityRow(row) : null;
      if (!dto) return err(new DatabaseError('Failed to record agent activity'));
      return ok(dto);
    } catch (error) {
      logger.error('Failed to start agent activity', error);
      return err(new DatabaseError('Failed to record agent activity'));
    }
  }

  async finish(input: CompleteAgentActivityInput): Promise<Result<void, ApplicationError>> {
    try {
      const update: AgentActivityUpdate = {
        status: input.status,
        completedAt: new Date(),
        ...(input.summary ? { summary: input.summary } : {}),
      };
      await db
        .update(agentActivities)
        .set(update)
        .where(eq(agentActivities.id, input.activityId));
      return ok(undefined);
    } catch (error) {
      logger.error('Failed to finish agent activity', error);
      return err(new DatabaseError('Failed to update agent activity'));
    }
  }

  async listByProject(
    projectId: string,
    limit = 50,
  ): Promise<Result<AgentActivityDTO[], ApplicationError>> {
    try {
      const rows = await db
        .select()
        .from(agentActivities)
        .where(eq(agentActivities.projectId, projectId))
        .orderBy(desc(agentActivities.createdAt))
        .limit(limit);
      const dtos: AgentActivityDTO[] = [];
      for (const row of rows) {
        const dto = mapActivityRow(row);
        if (dto) dtos.push(dto);
      }
      return ok(dtos);
    } catch (error) {
      logger.error('Failed to list agent activities', error);
      return err(new DatabaseError('Failed to list agent activities'));
    }
  }
}

export class DrizzleTeamPlanRepository implements ITeamPlanRepository {
  async upsert(projectId: string, plan: TeamPlan): Promise<Result<TeamPlanDTO, ApplicationError>> {
    try {
      const now = new Date();
      const insertRow: NewTeamPlanRow = { projectId, plan, updatedAt: now };
      const update: TeamPlanUpdate = { plan, updatedAt: now };
      const [row] = await db
        .insert(teamPlans)
        .values(insertRow)
        .onConflictDoUpdate({
          target: teamPlans.projectId,
          set: update,
        })
        .returning();
      if (!row) return err(new DatabaseError('Failed to save team plan'));
      return ok(this.mapRow(row));
    } catch (error) {
      logger.error('Failed to upsert team plan', error);
      return err(new DatabaseError('Failed to save team plan'));
    }
  }

  async findByProject(projectId: string): Promise<Result<TeamPlanDTO | null, ApplicationError>> {
    try {
      const [row] = await db
        .select()
        .from(teamPlans)
        .where(eq(teamPlans.projectId, projectId))
        .limit(1);
      if (!row) return ok(null);
      return ok(this.mapRow(row));
    } catch (error) {
      logger.error('Failed to load team plan', error);
      return err(new DatabaseError('Failed to load team plan'));
    }
  }

  private mapRow(row: typeof teamPlans.$inferSelect): TeamPlanDTO {
    const plan = TeamPlanSchema.safeParse(row.plan);
    return {
      id: row.id,
      projectId: row.projectId,
      plan: plan.success
        ? plan.data
        : { summary: '', roles: [{ role: 'Product team', agentRole: null, mission: '', skills: [] }], recommendedSkills: [], recommendedAgents: [], recommendedRules: [] },
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

export const agentActivityRepository = new DrizzleAgentActivityRepository();
export const teamPlanRepository = new DrizzleTeamPlanRepository();
