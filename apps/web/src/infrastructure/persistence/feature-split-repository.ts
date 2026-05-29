/**
 * Drizzle Feature Split Repository Adapter
 */

import { randomUUID } from 'node:crypto';
import { IFeatureSplitRepository } from '@domain/feature-split/feature-split-repository';
import { FeatureSplitDomain, FeatureClusterDomain, NewFeatureClusterInput } from '@domain/feature-split/feature-split';
import { Result, ok, err } from '@repo/result';
import { ApplicationError, DatabaseError, NotFoundError } from '@shared/errors/application-error';
import {
  db,
  featureSplits,
  featureSplitClusters,
  eq,
  and,
  asc,
  type NewFeatureSplitCluster,
  type FeatureSplitUpdate,
} from '@repo/db';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ service: 'FeatureSplitRepository' });

function mapClusterToDomain(row: typeof featureSplitClusters.$inferSelect): FeatureClusterDomain {
  return {
    id: row.id,
    featureSplitId: row.featureSplitId,
    sortOrder: row.sortOrder,
    label: row.label,
    valueLine: row.valueLine,
    boundaryCue: row.boundaryCue,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapToDomain(
  split: typeof featureSplits.$inferSelect,
  clusters: typeof featureSplitClusters.$inferSelect[]
): FeatureSplitDomain {
  return {
    id: split.id,
    projectId: split.projectId,
    sourcePrdVersionId: split.sourcePrdVersionId,
    status: split.status as 'draft' | 'confirmed',
    clusters: clusters.map(mapClusterToDomain),
    createdAt: split.createdAt,
    updatedAt: split.updatedAt,
  };
}

async function loadClusters(
  featureSplitId: string
): Promise<typeof featureSplitClusters.$inferSelect[]> {
  return db
    .select()
    .from(featureSplitClusters)
    .where(eq(featureSplitClusters.featureSplitId, featureSplitId))
    .orderBy(asc(featureSplitClusters.sortOrder));
}

export class DrizzleFeatureSplitRepository implements IFeatureSplitRepository {
  constructor(_db?: unknown) {}

  async findByProjectId(
    projectId: string
  ): Promise<Result<FeatureSplitDomain[], ApplicationError>> {
    try {
      const splits = await db
        .select()
        .from(featureSplits)
        .where(eq(featureSplits.projectId, projectId));

      const result: FeatureSplitDomain[] = await Promise.all(
        splits.map(async (s) => {
          const clusters = await loadClusters(s.id);
          return mapToDomain(s, clusters);
        })
      );

      return ok(result);
    } catch (error) {
      logger.error('Failed to list feature splits for project', error);
      return err(new DatabaseError('Failed to load feature splits'));
    }
  }

  async findByProjectAndPrdVersion(
    projectId: string,
    sourcePrdVersionId: string
  ): Promise<Result<FeatureSplitDomain | null, ApplicationError>> {
    try {
      const [split] = await db
        .select()
        .from(featureSplits)
        .where(
          and(
            eq(featureSplits.projectId, projectId),
            eq(featureSplits.sourcePrdVersionId, sourcePrdVersionId)
          )
        )
        .limit(1);

      if (!split) return ok(null);
      const clusters = await loadClusters(split.id);
      return ok(mapToDomain(split, clusters));
    } catch (error) {
      logger.error('Failed to find feature split by project + prd version', error);
      return err(new DatabaseError('Failed to load feature split'));
    }
  }

  async findById(id: string): Promise<Result<FeatureSplitDomain | null, ApplicationError>> {
    try {
      const [split] = await db
        .select()
        .from(featureSplits)
        .where(eq(featureSplits.id, id))
        .limit(1);

      if (!split) return ok(null);
      const clusters = await loadClusters(split.id);
      return ok(mapToDomain(split, clusters));
    } catch (error) {
      logger.error('Failed to find feature split by id', error);
      return err(new DatabaseError('Failed to load feature split'));
    }
  }

  async saveDraft(
    projectId: string,
    sourcePrdVersionId: string,
    clusters: NewFeatureClusterInput[]
  ): Promise<Result<FeatureSplitDomain, ApplicationError>> {
    try {
      const result = await db.transaction(async (tx) => {
        // Upsert split header
        let [existing] = await tx
          .select()
          .from(featureSplits)
          .where(
            and(
              eq(featureSplits.projectId, projectId),
              eq(featureSplits.sourcePrdVersionId, sourcePrdVersionId)
            )
          )
          .limit(1);

        if (!existing) {
          const [inserted] = await tx
            .insert(featureSplits)
            .values({ projectId, sourcePrdVersionId, status: 'draft' })
            .returning();
          existing = inserted;
        } else {
          const draftHeader: FeatureSplitUpdate = { status: 'draft', updatedAt: new Date() };
          const [updated] = await tx
            .update(featureSplits)
            .set(draftHeader)
            .where(eq(featureSplits.id, existing.id))
            .returning();
          existing = updated;
        }

        // Full cluster replace
        await tx
          .delete(featureSplitClusters)
          .where(eq(featureSplitClusters.featureSplitId, existing.id));

        const clusterRows: NewFeatureSplitCluster[] = clusters.map((c) => ({
          id: randomUUID(),
          featureSplitId: existing.id,
          sortOrder: c.sortOrder,
          label: c.label,
          valueLine: c.valueLine,
          boundaryCue: c.boundaryCue,
        }));

        const insertedClusters =
          clusterRows.length > 0
            ? await tx.insert(featureSplitClusters).values(clusterRows).returning()
            : [];

        return mapToDomain(existing, insertedClusters);
      });

      return ok(result);
    } catch (error) {
      logger.error('Failed to save feature split draft', error);
      return err(new DatabaseError('Failed to save feature split draft'));
    }
  }

  async confirm(id: string): Promise<Result<FeatureSplitDomain, ApplicationError>> {
    try {
      const confirmedHeader: FeatureSplitUpdate = {
        status: 'confirmed',
        updatedAt: new Date(),
      };
      const [updated] = await db
        .update(featureSplits)
        .set(confirmedHeader)
        .where(eq(featureSplits.id, id))
        .returning();

      if (!updated) return err(new NotFoundError('Feature split not found'));

      const clusters = await loadClusters(updated.id);
      return ok(mapToDomain(updated, clusters));
    } catch (error) {
      logger.error('Failed to confirm feature split', error);
      return err(new DatabaseError('Failed to confirm feature split'));
    }
  }
}
