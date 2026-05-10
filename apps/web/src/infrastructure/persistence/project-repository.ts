/**
 * Prisma Project Repository Adapter
 */

import { IProjectRepository, ProjectWithCounts } from '@domain/project/project-repository';
import { Project } from '@domain/project/project';
import { Result, ok, err } from '@shared/result/result';
import { ApplicationError, NotFoundError, DatabaseError } from '@shared/errors/application-error';
import { PrismaClient } from '@prisma/client';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ service: 'ProjectRepository' });

export class PrismaProjectRepository implements IProjectRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(projectId: string): Promise<Result<Project, ApplicationError>> {
    try {
      const p = await this.prisma.project.findUnique({ where: { id: projectId } });
      if (!p) return err(new NotFoundError('Project not found'));
      return ok(this.mapToDomain(p)) as any;
    } catch (error) {
      logger.error('Failed to find project', error);
      return err(new DatabaseError('Failed to find project'));
    }
  }

  async findByIdAndUserId(projectId: string, userId: string): Promise<Result<Project, ApplicationError>> {
    try {
      const p = await this.prisma.project.findFirst({
        where: { id: projectId, userId },
      });
      if (!p) return err(new NotFoundError('Project not found'));
      return ok(this.mapToDomain(p)) as any;
    } catch (error) {
      logger.error('Failed to find project by user', error);
      return err(new DatabaseError('Failed to find project'));
    }
  }

  async findAllByUserId(userId: string): Promise<Result<ProjectWithCounts[], ApplicationError>> {
    try {
      const projects = await this.prisma.project.findMany({
        where: { userId },
        include: {
          prdVersions: { orderBy: { versionNumber: 'desc' }, take: 1 },
          _count: { select: { prdVersions: true, questionHistory: true } },
        },
        orderBy: { updatedAt: 'desc' },
      });

      const result: ProjectWithCounts[] = projects.map((p: any) => ({
        ...this.mapToDomain(p),
        latestPrdVersion: p.prdVersions[0]
          ? { versionNumber: p.prdVersions[0].versionNumber, content: p.prdVersions[0].content }
          : null,
        prdVersionCount: p._count.prdVersions,
        questionHistoryCount: p._count.questionHistory,
      }));

      return ok(result) as any;
    } catch (error) {
      logger.error('Failed to list projects', error);
      return err(new DatabaseError('Failed to list projects'));
    }
  }

  async create(project: Project): Promise<Result<Project, ApplicationError>> {
    try {
      const p = await this.prisma.project.create({
        data: {
          id: project.id,
          userId: project.userId,
          name: project.name,
          description: project.description,
          phase: project.phase,
        },
      });
      logger.info('Project created', { projectId: p.id });
      return ok(this.mapToDomain(p)) as any;
    } catch (error) {
      logger.error('Failed to create project', error);
      return err(new DatabaseError('Failed to create project'));
    }
  }

  async update(project: Project): Promise<Result<Project, ApplicationError>> {
    try {
      const p = await this.prisma.project.update({
        where: { id: project.id },
        data: {
          name: project.name,
          description: project.description,
          phase: project.phase,
          architectureStartedAt: project.architectureStartedAt,
        },
      });
      logger.info('Project updated', { projectId: p.id });
      return ok(this.mapToDomain(p)) as any;
    } catch (error) {
      logger.error('Failed to update project', error);
      return err(new DatabaseError('Failed to update project'));
    }
  }

  async delete(projectId: string): Promise<Result<void, ApplicationError>> {
    try {
      await this.prisma.project.delete({ where: { id: projectId } });
      logger.info('Project deleted', { projectId });
      return ok(undefined) as any;
    } catch (error) {
      logger.error('Failed to delete project', error);
      return err(new DatabaseError('Failed to delete project'));
    }
  }

  private mapToDomain(p: any): Project {
    return {
      id: p.id,
      userId: p.userId,
      name: p.name,
      description: p.description,
      phase: p.phase || 'intake',
      architectureStartedAt: p.architectureStartedAt,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }
}
