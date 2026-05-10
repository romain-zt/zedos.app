/**
 * Drizzle Project Repository Adapter
 */

import { IProjectRepository, ProjectWithCounts } from '@domain/project/project-repository';
import { Project, ProjectPhase } from '@domain/project/project';
import { Result, ok, err } from '@shared/result/result';
import { ApplicationError, NotFoundError, DatabaseError } from '@shared/errors/application-error';
import { db, eq, and, desc, sql, projects, prdVersions, questionHistory, type DrizzleDb } from '@repo/db';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ service: 'ProjectRepository' });

type ProjectRow = typeof projects.$inferSelect;

export class DrizzleProjectRepository implements IProjectRepository {
  constructor(private database: DrizzleDb = db) {}

  async findById(projectId: string): Promise<Result<Project, ApplicationError>> {
    try {
      const result = await this.database
        .select()
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);

      if (result.length === 0) {
        return err(new NotFoundError('Project not found'));
      }

      return ok(this.mapToDomain(result[0])) as Result<Project, ApplicationError>;
    } catch (error) {
      logger.error('Failed to find project', error);
      return err(new DatabaseError('Failed to find project'));
    }
  }

  async findByIdAndUserId(projectId: string, userId: string): Promise<Result<Project, ApplicationError>> {
    try {
      const result = await this.database
        .select()
        .from(projects)
        .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
        .limit(1);

      if (result.length === 0) {
        return err(new NotFoundError('Project not found'));
      }

      return ok(this.mapToDomain(result[0])) as Result<Project, ApplicationError>;
    } catch (error) {
      logger.error('Failed to find project by user', error);
      return err(new DatabaseError('Failed to find project'));
    }
  }

  async findAllByUserId(userId: string): Promise<Result<ProjectWithCounts[], ApplicationError>> {
    try {
      const projectRows = await this.database
        .select()
        .from(projects)
        .where(eq(projects.userId, userId))
        .orderBy(desc(projects.updatedAt));

      const results: ProjectWithCounts[] = [];

      for (const p of projectRows) {
        const latestPrd = await this.database
          .select()
          .from(prdVersions)
          .where(eq(prdVersions.projectId, p.id))
          .orderBy(desc(prdVersions.versionNumber))
          .limit(1);

        const prdCountResult = await this.database
          .select({ count: sql<number>`count(*)::int` })
          .from(prdVersions)
          .where(eq(prdVersions.projectId, p.id));

        const questionCountResult = await this.database
          .select({ count: sql<number>`count(*)::int` })
          .from(questionHistory)
          .where(eq(questionHistory.projectId, p.id));

        results.push({
          ...this.mapToDomain(p),
          latestPrdVersion: latestPrd[0]
            ? { versionNumber: latestPrd[0].versionNumber, content: latestPrd[0].content as Record<string, unknown> }
            : null,
          prdVersionCount: prdCountResult[0]?.count ?? 0,
          questionHistoryCount: questionCountResult[0]?.count ?? 0,
        });
      }

      return ok(results) as Result<ProjectWithCounts[], ApplicationError>;
    } catch (error) {
      logger.error('Failed to list projects', error);
      return err(new DatabaseError('Failed to list projects'));
    }
  }

  async create(project: Project): Promise<Result<Project, ApplicationError>> {
    try {
      const result = await this.database
        .insert(projects)
        .values({
          id: project.id,
          userId: project.userId,
          name: project.name,
          description: project.description,
          phase: project.phase,
        } as typeof projects.$inferInsert)
        .returning();

      logger.info('Project created', { projectId: result[0].id });
      return ok(this.mapToDomain(result[0])) as Result<Project, ApplicationError>;
    } catch (error) {
      logger.error('Failed to create project', error);
      return err(new DatabaseError('Failed to create project'));
    }
  }

  async update(project: Project): Promise<Result<Project, ApplicationError>> {
    try {
      const result = await this.database
        .update(projects)
        .set({
          name: project.name,
          description: project.description,
          phase: project.phase,
          architectureStartedAt: project.architectureStartedAt,
        } as Partial<typeof projects.$inferInsert>)
        .where(eq(projects.id, project.id))
        .returning();

      if (result.length === 0) {
        return err(new NotFoundError('Project not found'));
      }

      logger.info('Project updated', { projectId: result[0].id });
      return ok(this.mapToDomain(result[0])) as Result<Project, ApplicationError>;
    } catch (error) {
      logger.error('Failed to update project', error);
      return err(new DatabaseError('Failed to update project'));
    }
  }

  async delete(projectId: string): Promise<Result<void, ApplicationError>> {
    try {
      await this.database.delete(projects).where(eq(projects.id, projectId));
      logger.info('Project deleted', { projectId });
      return ok(undefined) as Result<void, ApplicationError>;
    } catch (error) {
      logger.error('Failed to delete project', error);
      return err(new DatabaseError('Failed to delete project'));
    }
  }

  private mapToDomain(p: ProjectRow): Project {
    return {
      id: p.id,
      userId: p.userId,
      name: p.name,
      description: p.description,
      phase: (p.phase || 'intake') as ProjectPhase,
      architectureStartedAt: p.architectureStartedAt,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }
}

export { DrizzleProjectRepository as PrismaProjectRepository };
