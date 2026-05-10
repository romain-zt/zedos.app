/**
 * Prisma PRD Repository Adapter
 */

import { IPrdRepository } from '@domain/prd/prd-repository';
import { PrdVersion, PrdVersionWithRelations } from '@domain/prd/prd';
import { Result, ok, err } from '@shared/result/result';
import { ApplicationError, DatabaseError } from '@shared/errors/application-error';
import { PrismaClient } from '@prisma/client';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ service: 'PrdRepository' });

export class PrismaPrdRepository implements IPrdRepository {
  constructor(private prisma: PrismaClient) {}

  async findByProjectId(projectId: string): Promise<Result<PrdVersionWithRelations[], ApplicationError>> {
    try {
      const versions = await this.prisma.prdVersion.findMany({
        where: { projectId },
        orderBy: { versionNumber: 'desc' },
        include: {
          shareLinks: { where: { enabled: true } },
          _count: { select: { questionHistory: true } },
        },
      });

      const result: PrdVersionWithRelations[] = versions.map((v: any) => ({
        id: v.id,
        projectId: v.projectId,
        versionNumber: v.versionNumber,
        content: v.content as Record<string, unknown> | null,
        status: v.status as any,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
        shareLinks: v.shareLinks.map((sl: any) => ({
          id: sl.id,
          token: sl.token,
          enabled: sl.enabled,
        })),
        questionHistoryCount: v._count.questionHistory,
      }));

      return ok(result) as any;
    } catch (error) {
      logger.error('Failed to fetch PRD versions', error);
      return err(new DatabaseError('Failed to fetch PRD versions'));
    }
  }

  async findLatestByProjectId(projectId: string): Promise<Result<PrdVersion | null, ApplicationError>> {
    try {
      const prd = await this.prisma.prdVersion.findFirst({
        where: { projectId },
        orderBy: { versionNumber: 'desc' },
      });

      if (!prd) return ok(null) as any;

      return ok({
        id: prd.id,
        projectId: prd.projectId,
        versionNumber: prd.versionNumber,
        content: prd.content as Record<string, unknown> | null,
        status: prd.status as any,
        createdAt: prd.createdAt,
        updatedAt: prd.updatedAt,
      }) as any;
    } catch (error) {
      logger.error('Failed to fetch latest PRD', error);
      return err(new DatabaseError('Failed to fetch latest PRD'));
    }
  }
}
