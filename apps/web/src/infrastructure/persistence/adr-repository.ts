/**
 * Drizzle ADR Repository Adapter
 */

import { IAdrRepository } from '@domain/adr/adr-repository';
import { Adr, AdrStatus, CORE_ADR_COUNT } from '@domain/adr/adr';
import { Result, ok, err } from '@repo/result';
import { ApplicationError, DatabaseError } from '@shared/errors/application-error';
import { db, adrs, eq, and, lt, asc } from '@repo/db';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ service: 'AdrRepository' });

export class DrizzleAdrRepository implements IAdrRepository {
  async findByProjectId(projectId: string): Promise<Result<Adr[], ApplicationError>> {
    try {
      const rows = await db
        .select()
        .from(adrs)
        .where(eq(adrs.projectId, projectId))
        .orderBy(asc(adrs.adrNumber));

      return ok(rows.map((a) => this.mapToDomain(a))) as Result<Adr[], ApplicationError>;
    } catch (error) {
      logger.error('Failed to list ADRs', error);
      return err(new DatabaseError('Failed to list ADRs'));
    }
  }

  async findByProjectIdAndNumber(
    projectId: string,
    adrNumber: number
  ): Promise<Result<Adr | null, ApplicationError>> {
    try {
      const [row] = await db
        .select()
        .from(adrs)
        .where(and(eq(adrs.projectId, projectId), eq(adrs.adrNumber, adrNumber)))
        .limit(1);

      if (!row) {
        return ok(null) as Result<Adr | null, ApplicationError>;
      }

      return ok(this.mapToDomain(row)) as Result<Adr | null, ApplicationError>;
    } catch (error) {
      logger.error('Failed to find ADR', error);
      return err(new DatabaseError('Failed to find ADR'));
    }
  }

  async update(
    projectId: string,
    adrNumber: number,
    data: { title?: string; content?: string; status?: string }
  ): Promise<Result<Adr, ApplicationError>> {
    try {
      const [row] = await db
        .update(adrs)
        .set(data)
        .where(and(eq(adrs.projectId, projectId), eq(adrs.adrNumber, adrNumber)))
        .returning();

      if (!row) {
        return err(new DatabaseError('ADR not found'));
      }

      return ok(this.mapToDomain(row)) as Result<Adr, ApplicationError>;
    } catch (error) {
      logger.error('Failed to update ADR', error);
      return err(new DatabaseError('Failed to update ADR'));
    }
  }

  async countCompleteCore(projectId: string): Promise<Result<{ total: number; complete: number }, ApplicationError>> {
    try {
      const rows = await db
        .select()
        .from(adrs)
        .where(and(eq(adrs.projectId, projectId), lt(adrs.adrNumber, CORE_ADR_COUNT)));

      const complete = rows.filter((a) => a.status === 'complete').length;
      return ok({ total: rows.length, complete }) as Result<{ total: number; complete: number }, ApplicationError>;
    } catch (error) {
      logger.error('Failed to count core ADRs', error);
      return err(new DatabaseError('Failed to count core ADRs'));
    }
  }

  private mapToDomain(row: typeof adrs.$inferSelect): Adr {
    return {
      id: row.id,
      projectId: row.projectId,
      adrNumber: row.adrNumber,
      title: row.title,
      content: row.content,
      status: row.status as AdrStatus,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

// Export for backwards compatibility
