/**
 * Drizzle red-team report repository.
 *
 * Transactional `complete` ensures the report row's status flip and the bulk
 * findings insert happen atomically, so a partial failure never leaves a report
 * marked completed without its findings.
 */

import { Result, ok, err } from '@repo/result';
import { ApplicationError, DatabaseError } from '@shared/errors/application-error';
import {
  IRedTeamReportRepository,
  CreatePendingReportInput,
  CompleteReportInput,
  FailReportInput,
} from '@domain/red-team/red-team-report-repository';
import type {
  RedTeamCategory,
  RedTeamSeverity,
  RedTeamReportStatus,
} from '@repo/contracts/ai';
import type {
  RedTeamReport,
  RedTeamReportWithFindings,
  RedTeamFinding,
} from '@domain/red-team/red-team-report';
import {
  db,
  redTeamReports,
  redTeamFindings,
  eq,
  desc,
  asc,
  and,
  type NewRedTeamReportRow,
  type NewRedTeamFindingRow,
  type RedTeamReportUpdate,
} from '@repo/db';
import type { PgUpdateSetSource } from 'drizzle-orm/pg-core';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ service: 'RedTeamReportRepository' });

function mapReportRow(row: typeof redTeamReports.$inferSelect): RedTeamReport {
  return {
    id: row.id,
    projectId: row.projectId,
    prdVersionId: row.prdVersionId,
    requestedByUserId: row.requestedByUserId,
    status: row.status as RedTeamReportStatus,
    creditCost: row.creditCost,
    findingCount: row.findingCount,
    errorMessage: row.errorMessage,
    createdAt: row.createdAt,
    completedAt: row.completedAt,
  };
}

function mapFindingRow(row: typeof redTeamFindings.$inferSelect): RedTeamFinding {
  return {
    id: row.id,
    sortOrder: row.sortOrder,
    category: row.category as RedTeamCategory,
    severity: row.severity as RedTeamSeverity,
    sectionId: row.sectionId,
    title: row.title,
    evidence: row.evidence,
    suggestion: row.suggestion,
    metadata: row.metadata,
  };
}

export class DrizzleRedTeamReportRepository implements IRedTeamReportRepository {
  async createPending(
    input: CreatePendingReportInput,
  ): Promise<Result<RedTeamReport, ApplicationError>> {
    try {
      const insertData: NewRedTeamReportRow = {
        projectId: input.projectId,
        prdVersionId: input.prdVersionId,
        requestedByUserId: input.requestedByUserId,
        status: 'pending',
        creditCost: input.creditCost,
        findingCount: 0,
      };
      const [row] = await db.insert(redTeamReports).values(insertData).returning();
      if (row === undefined) {
        return err(new DatabaseError('Failed to create red-team report'));
      }
      return ok(mapReportRow(row));
    } catch (error) {
      logger.error('createPending failed', error);
      return err(new DatabaseError('Failed to create red-team report'));
    }
  }

  async complete(
    input: CompleteReportInput,
  ): Promise<Result<RedTeamReportWithFindings, ApplicationError>> {
    try {
      const result = await db.transaction(async (tx) => {
        const status: RedTeamReportStatus = input.findings.length === 0 ? 'empty' : 'completed';
        const patch: RedTeamReportUpdate = {
          status,
          findingCount: input.findings.length,
          completedAt: new Date(),
          errorMessage: null,
        };
        const [updated] = await tx
          .update(redTeamReports)
          .set(patch as PgUpdateSetSource<typeof redTeamReports>)
          .where(eq(redTeamReports.id, input.reportId))
          .returning();
        if (updated === undefined) {
          throw new Error('Report not found for completion');
        }

        let findingRows: (typeof redTeamFindings.$inferSelect)[] = [];
        if (input.findings.length > 0) {
          const rows: NewRedTeamFindingRow[] = input.findings.map((f) => ({
            reportId: input.reportId,
            sortOrder: f.sortOrder,
            category: f.category,
            severity: f.severity,
            sectionId: f.sectionId,
            title: f.title,
            evidence: f.evidence,
            suggestion: f.suggestion,
            metadata: f.metadata,
          }));
          findingRows = await tx.insert(redTeamFindings).values(rows).returning();
        }

        const report = mapReportRow(updated);
        const findings = findingRows
          .map(mapFindingRow)
          .sort((a, b) => a.sortOrder - b.sortOrder);
        return { ...report, findings };
      });

      return ok(result);
    } catch (error) {
      logger.error('complete failed', error);
      return err(new DatabaseError('Failed to persist red-team findings'));
    }
  }

  async fail(input: FailReportInput): Promise<Result<RedTeamReport, ApplicationError>> {
    try {
      const patch: RedTeamReportUpdate = {
        status: 'failed',
        errorMessage: input.errorMessage,
        completedAt: new Date(),
      };
      const [updated] = await db
        .update(redTeamReports)
        .set(patch as PgUpdateSetSource<typeof redTeamReports>)
        .where(eq(redTeamReports.id, input.reportId))
        .returning();
      if (updated === undefined) {
        return err(new DatabaseError('Report not found for fail()'));
      }
      return ok(mapReportRow(updated));
    } catch (error) {
      logger.error('fail failed', error);
      return err(new DatabaseError('Failed to mark red-team report failed'));
    }
  }

  async listByProject(
    projectId: string,
    requestedByUserId: string,
  ): Promise<Result<RedTeamReport[], ApplicationError>> {
    try {
      const rows = await db
        .select()
        .from(redTeamReports)
        .where(
          and(
            eq(redTeamReports.projectId, projectId),
            eq(redTeamReports.requestedByUserId, requestedByUserId),
          ),
        )
        .orderBy(desc(redTeamReports.createdAt));
      return ok(rows.map(mapReportRow));
    } catch (error) {
      logger.error('listByProject failed', error);
      return err(new DatabaseError('Failed to list red-team reports'));
    }
  }

  async findByIdForOwner(
    reportId: string,
    requestedByUserId: string,
  ): Promise<Result<RedTeamReportWithFindings | null, ApplicationError>> {
    try {
      const [row] = await db
        .select()
        .from(redTeamReports)
        .where(
          and(
            eq(redTeamReports.id, reportId),
            eq(redTeamReports.requestedByUserId, requestedByUserId),
          ),
        )
        .limit(1);
      if (row === undefined) return ok(null);

      const findingRows = await db
        .select()
        .from(redTeamFindings)
        .where(eq(redTeamFindings.reportId, reportId))
        .orderBy(asc(redTeamFindings.sortOrder));

      const report = mapReportRow(row);
      return ok({ ...report, findings: findingRows.map(mapFindingRow) });
    } catch (error) {
      logger.error('findByIdForOwner failed', error);
      return err(new DatabaseError('Failed to load red-team report'));
    }
  }
}
