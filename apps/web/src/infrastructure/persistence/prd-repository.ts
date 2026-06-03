/**
 * Drizzle PRD Repository Adapter
 */

import crypto from 'node:crypto';
import type { PgUpdateSetSource } from 'drizzle-orm/pg-core/query-builders/update';
import { IPrdRepository } from '@domain/prd/prd-repository';
import {
  AnonymousSharedPrdSnapshot,
  MintShareLinkOptions,
  MintedShareLink,
  PrdVersion,
  PrdVersionWithRelations,
  PrdStatus,
  ShareLinkGate,
} from '@domain/prd/prd';
import { hashSharePassword, verifySharePassword } from '@shared/crypto/share-password';
import { Result, ok, err } from '@repo/result';
import {
  ApplicationError,
  DatabaseError,
  ExternalServiceError,
  NotFoundError,
} from '@shared/errors/application-error';
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
import type { PrdVersionContent } from '@repo/contracts/prd';
import type { PrdDeliverableKind } from '@repo/contracts/prd';
import { AnonymousSharedPrdResponseSchema } from '@repo/contracts/share/anonymous-read';
import { parsePrdVersionContent } from '@infrastructure/persistence/prd-content-parse';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ service: 'PrdRepository' });

function mapDeliverableKind(value: string | null | undefined): PrdDeliverableKind {
  return value === 'express' ? 'express' : 'standard';
}

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
            content: parsePrdVersionContent(v.content),
            status: v.status as PrdStatus,
            deliverableKind: mapDeliverableKind(v.deliverableKind),
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
        content: parsePrdVersionContent(prd.content),
        status: prd.status as PrdStatus,
        deliverableKind: mapDeliverableKind(prd.deliverableKind),
        createdAt: prd.createdAt,
        updatedAt: prd.updatedAt,
      }) as Result<PrdVersion | null, ApplicationError>;
    } catch (error) {
      logger.error('Failed to fetch latest PRD', error);
      return err(new DatabaseError('Failed to fetch latest PRD'));
    }
  }

  async findVersionByIdForOwner(
    prdVersionId: string,
    ownerUserId: string
  ): Promise<Result<PrdVersion | null, ApplicationError>> {
    try {
      const [row] = await db
        .select({
          id: prdVersions.id,
          projectId: prdVersions.projectId,
          versionNumber: prdVersions.versionNumber,
          content: prdVersions.content,
          status: prdVersions.status,
          deliverableKind: prdVersions.deliverableKind,
          createdAt: prdVersions.createdAt,
          updatedAt: prdVersions.updatedAt,
          projectUserId: projects.userId,
        })
        .from(prdVersions)
        .innerJoin(projects, eq(prdVersions.projectId, projects.id))
        .where(and(eq(prdVersions.id, prdVersionId), eq(projects.userId, ownerUserId)))
        .limit(1);

      if (!row) {
        return ok(null) as Result<PrdVersion | null, ApplicationError>;
      }

      return ok({
        id: row.id,
        projectId: row.projectId,
        versionNumber: row.versionNumber,
        content: parsePrdVersionContent(row.content),
        status: row.status as PrdStatus,
        deliverableKind: mapDeliverableKind(row.deliverableKind),
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }) as Result<PrdVersion | null, ApplicationError>;
    } catch (error) {
      logger.error('findVersionByIdForOwner failed', error);
      return err(new DatabaseError('Failed to fetch PRD version'));
    }
  }

  async ensureFirstVersion(
    projectId: string,
    content: PrdVersionContent | null
  ): Promise<Result<{ created: boolean; version: PrdVersion }, ApplicationError>> {
    try {
      const latestResult = await this.findLatestByProjectId(projectId);
      if (latestResult.isErr()) return err(latestResult.error);
      const existing = latestResult.unwrap();
      if (existing) {
        return ok({ created: false, version: existing }) as Result<{ created: boolean; version: PrdVersion }, ApplicationError>;
      }

      const defaultContent: PrdVersionContent =
        content ??
        ({
          title: 'Draft PRD',
          version_summary:
            'Initial in-app placeholder — run Generate PRD after clarification when ready.',
          sections: [],
        } satisfies PrdVersionContent);

      const now = new Date();
      const [inserted] = await db
        .insert(prdVersions)
        .values({
          projectId,
          versionNumber: 1,
          content: defaultContent,
          status: 'draft',
          updatedAt: now,
        } as NewPrdVersion)
        .onConflictDoNothing({
          target: [prdVersions.projectId, prdVersions.versionNumber],
        })
        .returning();

      if (!inserted) {
        const racedResult = await this.findLatestByProjectId(projectId);
        if (racedResult.isErr()) return err(racedResult.error);
        const raced = racedResult.unwrap();
        if (!raced) {
          return err(new DatabaseError('Failed to create PRD version'));
        }
        return ok({ created: false, version: raced }) as Result<
          { created: boolean; version: PrdVersion },
          ApplicationError
        >;
      }

      return ok({
        created: true,
        version: {
          id: inserted.id,
          projectId: inserted.projectId,
          versionNumber: inserted.versionNumber,
          content: parsePrdVersionContent(inserted.content),
          status: inserted.status as PrdStatus,
          deliverableKind: mapDeliverableKind(inserted.deliverableKind),
          createdAt: inserted.createdAt,
          updatedAt: inserted.updatedAt,
        },
      }) as Result<{ created: boolean; version: PrdVersion }, ApplicationError>;
    } catch (error) {
      logger.error('Failed to ensure first PRD version', error);
      return err(new DatabaseError('Failed to ensure first PRD version'));
    }
  }

  private mapMintedShareLink(row: typeof shareLinks.$inferSelect): MintedShareLink {
    return {
      id: row.id,
      prdVersionId: row.prdVersionId,
      token: row.token,
      enabled: row.enabled,
      hasPassword: Boolean(row.passwordHash),
      expiresAt: row.expiresAt ?? null,
      createdAt: row.createdAt,
      disabledAt: row.disabledAt ?? null,
    };
  }

  async mintReadOnlyShareLink(
    prdVersionId: string,
    ownerUserId: string,
    options?: MintShareLinkOptions
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

      const passwordHash =
        options?.password != null ? await hashSharePassword(options.password) : undefined;
      const expiresAt =
        options?.expiresInDays != null
          ? new Date(Date.now() + options.expiresInDays * 24 * 60 * 60 * 1000)
          : undefined;

      const [existing] = await db
        .select()
        .from(shareLinks)
        .where(and(eq(shareLinks.prdVersionId, prdVersionId), eq(shareLinks.enabled, true)))
        .limit(1);

      if (existing) {
        if (passwordHash != null || expiresAt != null) {
          const patch = {
            ...(passwordHash != null ? { passwordHash } : {}),
            ...(expiresAt != null ? { expiresAt } : {}),
          } as PgUpdateSetSource<typeof shareLinks>;
          const [updated] = await db
            .update(shareLinks)
            .set(patch)
            .where(eq(shareLinks.id, existing.id))
            .returning();
          if (updated) {
            return ok(this.mapMintedShareLink(updated));
          }
        }
        return ok(this.mapMintedShareLink(existing));
      }

      const token = crypto.randomBytes(16).toString('hex');
      const insertValues = {
        prdVersionId,
        token,
        enabled: true as const,
        passwordHash: passwordHash ?? null,
        expiresAt: expiresAt ?? null,
      } as typeof shareLinks.$inferInsert;
      const [inserted] = await db.insert(shareLinks).values(insertValues).returning();

      if (!inserted) {
        return err(new DatabaseError('Failed to create share link'));
      }

      return ok(this.mapMintedShareLink(inserted));
    } catch (error) {
      logger.error('mintReadOnlyShareLink failed', error);
      return err(new DatabaseError('Failed to create share link'));
    }
  }

  async getShareLinkGateByToken(token: string): Promise<Result<ShareLinkGate, ApplicationError>> {
    try {
      const [row] = await db
        .select({
          enabled: shareLinks.enabled,
          passwordHash: shareLinks.passwordHash,
          expiresAt: shareLinks.expiresAt,
        })
        .from(shareLinks)
        .where(eq(shareLinks.token, token))
        .limit(1);

      if (!row || !row.enabled) {
        return err(new NotFoundError('Share link not found or disabled'));
      }

      const expired = row.expiresAt != null && row.expiresAt.getTime() < Date.now();
      return ok({
        requiresPassword: Boolean(row.passwordHash),
        expired,
      });
    } catch (error) {
      logger.error('getShareLinkGateByToken failed', error);
      return err(new DatabaseError('Failed to load share link'));
    }
  }

  async verifyShareLinkPassword(
    token: string,
    password: string
  ): Promise<Result<boolean, ApplicationError>> {
    try {
      const [row] = await db
        .select({ passwordHash: shareLinks.passwordHash, enabled: shareLinks.enabled })
        .from(shareLinks)
        .where(eq(shareLinks.token, token))
        .limit(1);

      if (!row?.enabled || !row.passwordHash) {
        return err(new NotFoundError('Share link not found'));
      }

      const valid = await verifySharePassword(password, row.passwordHash);
      return ok(valid);
    } catch (error) {
      logger.error('verifyShareLinkPassword failed', error);
      return err(new DatabaseError('Failed to verify share password'));
    }
  }

  async revokeReadOnlyShareLink(
    shareLinkId: string,
    ownerUserId: string
  ): Promise<Result<MintedShareLink, ApplicationError>> {
    try {
      const [row] = await db
        .select({
          link: shareLinks,
          projectUserId: projects.userId,
        })
        .from(shareLinks)
        .innerJoin(prdVersions, eq(shareLinks.prdVersionId, prdVersions.id))
        .innerJoin(projects, eq(prdVersions.projectId, projects.id))
        .where(eq(shareLinks.id, shareLinkId))
        .limit(1);

      if (!row || row.projectUserId !== ownerUserId) {
        return err(new NotFoundError('Share link not found'));
      }

      const toMinted = (): MintedShareLink => this.mapMintedShareLink(row.link);

      if (!row.link.enabled) {
        return ok(toMinted());
      }

      const disabledAt = new Date();
      /* Drizzle 0.38: nullable columns without defaults are omitted from `$inferInsert` keys, so
       * `PgUpdateSetSource` does not list `disabledAt`; the cast matches the actual UPDATE shape. */
      const revokeRowPatch = {
        enabled: false as const,
        disabledAt,
      } as PgUpdateSetSource<typeof shareLinks>;
      const [updated] = await db
        .update(shareLinks)
        .set(revokeRowPatch)
        .where(and(eq(shareLinks.id, shareLinkId), eq(shareLinks.enabled, true)))
        .returning();

      if (!updated) {
        return err(new DatabaseError('Failed to disable share link'));
      }

      return ok(this.mapMintedShareLink(updated));
    } catch (error) {
      logger.error('revokeReadOnlyShareLink failed', error);
      return err(new DatabaseError('Failed to disable share link'));
    }
  }

  async getAnonymousPrdVersionByShareToken(
    token: string
  ): Promise<Result<AnonymousSharedPrdSnapshot, ApplicationError>> {
    try {
      const [row] = await db
        .select({
          enabled: shareLinks.enabled,
          expiresAt: shareLinks.expiresAt,
          versionNumber: prdVersions.versionNumber,
          content: prdVersions.content,
          status: prdVersions.status,
          deliverableKind: prdVersions.deliverableKind,
          createdAt: prdVersions.createdAt,
        })
        .from(shareLinks)
        .innerJoin(prdVersions, eq(shareLinks.prdVersionId, prdVersions.id))
        .where(eq(shareLinks.token, token))
        .limit(1);

      if (!row || !row.enabled) {
        return err(new NotFoundError('Share link not found or disabled'));
      }

      if (row.expiresAt != null && row.expiresAt.getTime() < Date.now()) {
        return err(new NotFoundError('Share link expired'));
      }

      const content = parsePrdVersionContent(row.content);

      const candidate = {
        versionNumber: row.versionNumber ?? 1,
        content,
        status: (row.status ?? 'draft') as PrdStatus,
        deliverableKind: mapDeliverableKind(row.deliverableKind),
        createdAt: row.createdAt,
      };

      const parsed = AnonymousSharedPrdResponseSchema.safeParse(candidate);
      if (!parsed.success) {
        logger.error('Anonymous shared PRD snapshot failed contract parse', parsed.error.flatten());
        return err(
          new ExternalServiceError('database', 'Shared PRD snapshot failed validation', 502)
        );
      }

      return ok({
        versionNumber: parsed.data.versionNumber,
        content: parsed.data.content,
        status: parsed.data.status as PrdStatus,
        deliverableKind: parsed.data.deliverableKind,
        createdAt: parsed.data.createdAt,
      });
    } catch (error) {
      logger.error('getAnonymousPrdVersionByShareToken failed', error);
      return err(new DatabaseError('Failed to load shared PRD'));
    }
  }
}

// Export for backwards compatibility
export { DrizzlePrdRepository as PrismaPrdRepository };
