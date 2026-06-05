/**
 * Drizzle Project Repository Adapter
 */

import { IProjectRepository, ProjectWithCounts } from '@domain/project/project-repository';
import { Project, ProjectPhase } from '@domain/project/project';
import { Result, ok, err } from '@repo/result';
import { ApplicationError, NotFoundError, DatabaseError } from '@shared/errors/application-error';
import { db, projects, prdVersions, questionHistory, projectMembers, eq, and, desc, sql, type NewProjectRow, type ProjectUpdate } from '@repo/db';
import { parsePrdVersionContent } from '@infrastructure/persistence/prd-content-parse';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ service: 'ProjectRepository' });

export class DrizzleProjectRepository implements IProjectRepository {
  // Constructor kept for API compatibility - argument is ignored since we use the singleton db
  constructor(_db?: unknown) {}

  async findById(projectId: string): Promise<Result<Project, ApplicationError>> {
    try {
      const [row] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);

      if (!row) {
        return err(new NotFoundError('Project not found'));
      }

      return ok(this.mapToDomain(row)) as Result<Project, ApplicationError>;
    } catch (error) {
      logger.error('Failed to find project', error);
      return err(new DatabaseError('Failed to find project'));
    }
  }

  async findByIdAndUserId(projectId: string, userId: string): Promise<Result<Project, ApplicationError>> {
    try {
      const [owned] = await db
        .select()
        .from(projects)
        .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
        .limit(1);

      if (owned) {
        return ok(this.mapToDomain(owned)) as Result<Project, ApplicationError>;
      }

      const [member] = await db
        .select({ projectId: projectMembers.projectId })
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, projectId),
            eq(projectMembers.userId, userId),
            eq(projectMembers.status, 'active')
          )
        )
        .limit(1);

      if (!member) {
        return err(new NotFoundError('Project not found'));
      }

      const [row] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);

      if (!row) {
        return err(new NotFoundError('Project not found'));
      }

      return ok(this.mapToDomain(row)) as Result<Project, ApplicationError>;
    } catch (error) {
      logger.error('Failed to find project by user', error);
      return err(new DatabaseError('Failed to find project'));
    }
  }

  async findAllByUserId(userId: string): Promise<Result<ProjectWithCounts[], ApplicationError>> {
    try {
      // Get all projects with their counts
      const projectRows = await db
        .select({
          id: projects.id,
          userId: projects.userId,
          name: projects.name,
          description: projects.description,
          phase: projects.phase,
          journeyMode: projects.journeyMode,
          architectureStartedAt: projects.architectureStartedAt,
          createdAt: projects.createdAt,
          updatedAt: projects.updatedAt,
        })
        .from(projects)
        .where(eq(projects.userId, userId))
        .orderBy(desc(projects.updatedAt));

      // For each project, get the latest PRD version and counts
      const result: ProjectWithCounts[] = await Promise.all(
        projectRows.map(async (p) => {
          // Get latest PRD version
          const [latestPrd] = await db
            .select({
              versionNumber: prdVersions.versionNumber,
              content: prdVersions.content,
            })
            .from(prdVersions)
            .where(eq(prdVersions.projectId, p.id))
            .orderBy(desc(prdVersions.versionNumber))
            .limit(1);

          // Count PRD versions
          const prdCountResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(prdVersions)
            .where(eq(prdVersions.projectId, p.id));
          const prdVersionCount = Number(prdCountResult[0]?.count || 0);

          // Count question history
          const qhCountResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(questionHistory)
            .where(eq(questionHistory.projectId, p.id));
          const questionHistoryCount = Number(qhCountResult[0]?.count || 0);

          return {
            ...this.mapToDomain(p),
            latestPrdVersion: latestPrd
              ? {
                  versionNumber: latestPrd.versionNumber,
                  content: parsePrdVersionContent(latestPrd.content) ?? { source: 'legacy', summary: '' },
                }
              : null,
            prdVersionCount,
            questionHistoryCount,
          };
        })
      );

      return ok(result) as Result<ProjectWithCounts[], ApplicationError>;
    } catch (error) {
      logger.error('Failed to list projects', error);
      return err(new DatabaseError('Failed to list projects'));
    }
  }

  async create(project: Project): Promise<Result<Project, ApplicationError>> {
    try {
      const insertData: NewProjectRow = {
        id: project.id,
        userId: project.userId,
        name: project.name,
        description: project.description,
        phase: project.phase,
        journeyMode: project.journeyMode,
      };
      const [row] = await db
        .insert(projects)
        .values(insertData)
        .returning();

      logger.info('Project created', { projectId: row.id });
      return ok(this.mapToDomain(row)) as Result<Project, ApplicationError>;
    } catch (error) {
      logger.error('Failed to create project', error);
      return err(new DatabaseError('Failed to create project'));
    }
  }

  async update(project: Project): Promise<Result<Project, ApplicationError>> {
    try {
      const updateData: ProjectUpdate = {
        name: project.name,
        description: project.description,
        phase: project.phase,
        journeyMode: project.journeyMode,
        architectureStartedAt: project.architectureStartedAt,
      };
      const [row] = await db
        .update(projects)
        .set(updateData)
        .where(eq(projects.id, project.id))
        .returning();

      if (!row) {
        return err(new NotFoundError('Project not found'));
      }

      logger.info('Project updated', { projectId: row.id });
      return ok(this.mapToDomain(row)) as Result<Project, ApplicationError>;
    } catch (error) {
      logger.error('Failed to update project', error);
      return err(new DatabaseError('Failed to update project'));
    }
  }

  async delete(projectId: string): Promise<Result<void, ApplicationError>> {
    try {
      await db.delete(projects).where(eq(projects.id, projectId));
      logger.info('Project deleted', { projectId });
      return ok(undefined) as Result<void, ApplicationError>;
    } catch (error) {
      logger.error('Failed to delete project', error);
      return err(new DatabaseError('Failed to delete project'));
    }
  }

  private mapToDomain(row: typeof projects.$inferSelect): Project {
    const journeyMode = row.journeyMode === 'express' ? 'express' : 'standard';
    return {
      id: row.id,
      userId: row.userId,
      name: row.name,
      description: row.description,
      phase: (row.phase || 'intake') as ProjectPhase,
      journeyMode,
      architectureStartedAt: row.architectureStartedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

// Export for backwards compatibility