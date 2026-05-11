/**
 * Drizzle PRD Repository Adapter
 */

import crypto from 'node:crypto';
import { IPrdRepository } from '@domain/prd/prd-repository';
import { MintedShareLink, PrdVersion, PrdVersionWithRelations, PrdStatus } from '@domain/prd/prd';
import { Result, ok, err } from '@repo/result';
import { ApplicationError, DatabaseError, NotFoundError } from '@shared/errors/application-error';
import {
  db,
  prdVersions,
  projects,
  shareLinks,
  questionHistory,
  eq,
  and,
  desc,
  sql,
  type NewPrdVersion,
} from '@repo/db';
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

  async ensureFirstVersion(
    projectId: string,
    content: Record<string, unknown> | null
  ): Promise<Result<{ created: boolean; version: PrdVersion }, ApplicationError>> {
    try {
      const latestResult = await this.findLatestByProjectId(projectId);
      if (latestResult.isErr()) return err(latestResult.error);
      const existing = latestResult.unwrap();
      if (existing) {
        return ok({ created: false, version: existing }) as Result<{ created: boolean; version: PrdVersion }, ApplicationError>;
      }

      const defaultContent =
        content ??
        ({
          source: 'in_app',
          summary: 'Initial PRD version (placeholder — edit via clarify and generate when ready)',
          sections: [],
        } satisfies Record<string, unknown>);

      const [inserted] = await db
        .insert(prdVersions)
        .values({
          projectId,
          versionNumber: 1,
          content: defaultContent,
          status: 'draft',
        } as NewPrdVersion)
        .returning();

      if (!inserted) {
        return err(new DatabaseError('Failed to create PRD version'));
      }

      return ok({
        created: true,
        version: {
          id: inserted.id,
          projectId: inserted.projectId,
          versionNumber: inserted.versionNumber,
          content: inserted.content as Record<string, unknown> | null,
          status: inserted.status as PrdStatus,
          createdAt: inserted.createdAt,
          updatedAt: inserted.updatedAt,
        },
      }) as Result<{ created: boolean; version: PrdVersion }, ApplicationError>;
    } catch (error) {
      logger.error('Failed to ensure first PRD version', error);
      return err(new DatabaseError('Failed to ensure first PRD version'));
    }
  }

  async mintReadOnlyShareLink(
    prdVersionId: string,
    ownerUserId: string
  ): Promise<Result<MintedShareLink, ApplicationError>> {
    try {
      const [prdVersion] = await db
        .select({ id: prdVersions.id, projectUserId: projects.userId })
        .from(prdVersions)
        .innerJoin(projects, eq(prdVersions.projectId, projects.id))
        .where(eq(prdVersions.id, prdVersionId))
        .limit(1);

      if (!prdVersion || prdVersion.projectUserId !== ownerUserId) {
        return err(new NotFoundError('PRD version not found'));
      }

      const [existing] = await db
        .select()
        .from(shareLinks)
        .where(and(eq(shareLinks.prdVersionId, prdVersionId), eq(shareLinks.enabled, true)))
        .limit(1);

      if (existing) {
        return ok({
          id: existing.id,
          prdVersionId: existing.prdVersionId,
          token: existing.token,
          enabled: existing.enabled,
          createdAt: existing.createdAt,
          disabledAt: existing.disabledAt ?? null,
        }) as Result<MintedShareLink, ApplicationError>;
      }

      const token = crypto.randomBytes(16).toString('hex');
      const [inserted] = await db.insert(shareLinks).values({ prdVersionId, token }).returning();

      if (!inserted) {
        return err(new DatabaseError('Failed to create share link'));
      }

      return ok({
        id: inserted.id,
        prdVersionId: inserted.prdVersionId,
        token: inserted.token,
        enabled: inserted.enabled,
        createdAt: inserted.createdAt,
        disabledAt: inserted.disabledAt ?? null,
      }) as Result<MintedShareLink, ApplicationError>;
    } catch (error) {
      logger.error('mintReadOnlyShareLink failed', error);
      return err(new DatabaseError('Failed to create share link'));
    }
  }
}

// Export for backwards compatibility
export { DrizzlePrdRepository as PrismaPrdRepository };
