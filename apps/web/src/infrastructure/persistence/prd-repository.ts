/**
 * Drizzle PRD Repository Adapter
 */

import { IPrdRepository } from '@domain/prd/prd-repository';
import { PrdVersion, PrdVersionWithRelations } from '@domain/prd/prd';
import { Result, ok, err } from '@shared/result/result';
import { ApplicationError, DatabaseError } from '@shared/errors/application-error';
import { db, eq, desc, sql, prdVersions, shareLinks, questionHistory, type DrizzleDb } from '@repo/db';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ service: 'PrdRepository' });

export class DrizzlePrdRepository implements IPrdRepository {
  constructor(private database: DrizzleDb = db) {}

  async findByProjectId(projectId: string): Promise<Result<PrdVersionWithRelations[], ApplicationError>> {
    try {
      const versions = await this.database
        .select()
        .from(prdVersions)
        .where(eq(prdVersions.projectId, projectId))
        .orderBy(desc(prdVersions.versionNumber));

      const results: PrdVersionWithRelations[] = [];

      for (const v of versions) {
        const links = await this.database
          .select()
          .from(shareLinks)
          .where(eq(shareLinks.prdVersionId, v.id));

        const enabledLinks = links.filter((sl) => sl.enabled);

        const questionCountResult = await this.database
          .select({ count: sql<number>`count(*)::int` })
          .from(questionHistory)
          .where(eq(questionHistory.prdVersionId, v.id));

        results.push({
          id: v.id,
          projectId: v.projectId,
          versionNumber: v.versionNumber,
          content: v.content as Record<string, unknown> | null,
          status: v.status as any,
          createdAt: v.createdAt,
          updatedAt: v.updatedAt,
          shareLinks: enabledLinks.map((sl) => ({
            id: sl.id,
            token: sl.token,
            enabled: sl.enabled,
          })),
          questionHistoryCount: questionCountResult[0]?.count ?? 0,
        });
      }

      return ok(results) as any;
    } catch (error) {
      logger.error('Failed to fetch PRD versions', error);
      return err(new DatabaseError('Failed to fetch PRD versions'));
    }
  }

  async findLatestByProjectId(projectId: string): Promise<Result<PrdVersion | null, ApplicationError>> {
    try {
      const result = await this.database
        .select()
        .from(prdVersions)
        .where(eq(prdVersions.projectId, projectId))
        .orderBy(desc(prdVersions.versionNumber))
        .limit(1);

      if (result.length === 0) {
        return ok(null) as any;
      }

      const prd = result[0];
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

export { DrizzlePrdRepository as PrismaPrdRepository };
