/**
 * Drizzle data room repository — records bundle audit rows, exposes the share-link and
 * user-story-title readers used by the bundle use case.
 */

import { Result, ok, err } from '@repo/result';
import { ApplicationError, DatabaseError } from '@shared/errors/application-error';
import {
  db,
  dataRoomBundles,
  shareLinks,
  prdVersions,
  userStoryLines,
  userStoryCorpora,
  featureSplitClusters,
  eq,
  desc,
  type NewDataRoomBundleRow,
} from '@repo/db';
import {
  IDataRoomRepository,
  RecordDataRoomBundleInput,
} from '@domain/data-room/data-room-repository';
import type { DataRoomBundle } from '@domain/data-room/bundle';
import type {
  DataRoomShareLinkReader,
  DataRoomUserStoryReader,
} from '@application/data-room/build-data-room-bundle-usecase';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ service: 'DataRoomBundleRepository' });

export class DrizzleDataRoomBundleRepository
  implements IDataRoomRepository, DataRoomShareLinkReader, DataRoomUserStoryReader
{
  async recordBundle(
    input: RecordDataRoomBundleInput,
  ): Promise<Result<DataRoomBundle, ApplicationError>> {
    try {
      const manifestJson = JSON.stringify(input.manifest);
      const insertData: NewDataRoomBundleRow = {
        projectId: input.projectId,
        generatedByUserId: input.generatedByUserId,
        fileCount: input.manifest.fileCount,
        byteSize: input.manifest.totalByteSize,
        manifestJson,
      };
      const [row] = await db.insert(dataRoomBundles).values(insertData).returning();
      if (row === undefined) {
        return err(new DatabaseError('Failed to record data room bundle'));
      }
      return ok({
        id: row.id,
        projectId: row.projectId,
        generatedByUserId: row.generatedByUserId,
        fileCount: row.fileCount,
        byteSize: row.byteSize,
        manifest: input.manifest,
        createdAt: row.createdAt,
      });
    } catch (error) {
      logger.error('recordBundle failed', error);
      return err(new DatabaseError('Failed to record data room bundle'));
    }
  }

  async listForProject(projectId: string): Promise<
    Result<
      Array<{
        id: string;
        enabled: boolean;
        createdAt: Date;
        expiresAt: Date | null;
        disabledAt: Date | null;
        prdVersionNumber: number;
      }>,
      ApplicationError
    >
  > {
    try {
      const rows = await db
        .select({
          id: shareLinks.id,
          enabled: shareLinks.enabled,
          createdAt: shareLinks.createdAt,
          expiresAt: shareLinks.expiresAt,
          disabledAt: shareLinks.disabledAt,
          prdVersionNumber: prdVersions.versionNumber,
          prdProjectId: prdVersions.projectId,
        })
        .from(shareLinks)
        .innerJoin(prdVersions, eq(shareLinks.prdVersionId, prdVersions.id))
        .where(eq(prdVersions.projectId, projectId))
        .orderBy(desc(shareLinks.createdAt));
      return ok(
        rows.map((r) => ({
          id: r.id,
          enabled: r.enabled,
          createdAt: r.createdAt,
          expiresAt: r.expiresAt,
          disabledAt: r.disabledAt,
          prdVersionNumber: r.prdVersionNumber,
        })),
      );
    } catch (error) {
      logger.error('listForProject (share links) failed', error);
      return err(new DatabaseError('Failed to load share link inventory'));
    }
  }

  async listTitlesForProject(projectId: string): Promise<
    Result<
      Array<{ corpusId: string; clusterLabel: string; title: string; sortOrder: number }>,
      ApplicationError
    >
  > {
    try {
      const rows = await db
        .select({
          corpusId: userStoryCorpora.id,
          clusterLabel: featureSplitClusters.label,
          title: userStoryLines.title,
          sortOrder: userStoryLines.sortOrder,
        })
        .from(userStoryLines)
        .innerJoin(userStoryCorpora, eq(userStoryLines.corpusId, userStoryCorpora.id))
        .innerJoin(
          featureSplitClusters,
          eq(userStoryCorpora.featureSplitClusterId, featureSplitClusters.id),
        )
        .where(eq(userStoryCorpora.projectId, projectId))
        .orderBy(featureSplitClusters.sortOrder, userStoryLines.sortOrder);

      return ok(rows);
    } catch (error) {
      logger.error('listTitlesForProject failed', error);
      return err(new DatabaseError('Failed to load user-story titles'));
    }
  }
}
