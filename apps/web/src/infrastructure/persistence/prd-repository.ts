/**
 * Drizzle PRD Repository Adapter
 */

import { IPrdRepository } from '@domain/prd/prd-repository';
import { PrdVersion, PrdVersionWithRelations, PrdStatus } from '@domain/prd/prd';
import { Result, ok, err } from '@repo/result';
import { ApplicationError, DatabaseError } from '@shared/errors/application-error';
import { db, prdVersions, shareLinks, questionHistory, eq, and, desc, sql } from '@repo/db';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ service: 'PrdRepository' });

export class DrizzlePrdRepository implements IPrdRepository {
  async findByProjectId(projectId: string): Promise<Result<PrdVersionWithRelations[], ApplicationError>> {
    try {
      // Get all PRD versions for this project
      const versions = await db
        .select()
        .from(prdVersions)
        .where(eq(prdVersions.projectId, projectId))
        .orderBy(desc(prdVersions.versionNumber));

      // For each version, get share links and question history count
      const result: PrdVersionWithRelations[] = await Promise.all(
        versions.map(async (v) => {
          // Get enabled share links
          const links = await db
            .select({
              id: shareLinks.id,
              token: shareLinks.token,
              enabled: shareLinks.enabled,
            })
            .from(shareLinks)
            .where(and(eq(shareLinks.prdVersionId, v.id), eq(shareLinks.enabled, true)));

          // Count question history
          const qhCountResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(questionHistory)
            .where(eq(questionHistory.prdVersionId, v.id));
          const questionHistoryCount = Number(qhCountResult[0]?.count || 0);

          return {
            id: v.id,
            projectId: v.projectId,
            versionNumber: v.versionNumber,
            content: v.content as Record<string, unknown> | null,
            status: v.status as PrdStatus,
            createdAt: v.createdAt,
            updatedAt: v.updatedAt,
            shareLinks: links.map((sl) => ({
              id: sl.id,
              token: sl.token,
              enabled: sl.enabled,
            })),
            questionHistoryCount,
          };
        })
      );

      return ok(result) as Result<PrdVersionWithRelations[], ApplicationError>;
    } catch (error) {
      logger.error('Failed to fetch PRD versions', error);
      return err(new DatabaseError('Failed to fetch PRD versions'));
    }
  }

  async findLatestByProjectId(projectId: string): Promise<Result<PrdVersion | null, ApplicationError>> {
    try {
      const [prd] = await db
        .select()
        .from(prdVersions)
        .where(eq(prdVersions.projectId, projectId))
        .orderBy(desc(prdVersions.versionNumber))
        .limit(1);

      if (!prd) {
        return ok(null) as Result<PrdVersion | null, ApplicationError>;
      }

      return ok({
        id: prd.id,
        projectId: prd.projectId,
        versionNumber: prd.versionNumber,
        content: prd.content as Record<string, unknown> | null,
        status: prd.status as PrdStatus,
        createdAt: prd.createdAt,
        updatedAt: prd.updatedAt,
      }) as Result<PrdVersion | null, ApplicationError>;
    } catch (error) {
      logger.error('Failed to fetch latest PRD', error);
      return err(new DatabaseError('Failed to fetch latest PRD'));
    }
  }
}

// Export for backwards compatibility
export { DrizzlePrdRepository as PrismaPrdRepository };
