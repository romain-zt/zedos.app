/**
 * Drizzle ADR Repository Adapter
 */

import { IAdrRepository } from '@domain/adr/adr-repository';
import { Adr, AdrStatus, CORE_ADR_COUNT } from '@domain/adr/adr';
import { Result, ok, err } from '@shared/result/result';
import { ApplicationError, NotFoundError, DatabaseError } from '@shared/errors/application-error';
import { db, eq, and, asc, adrs, type DrizzleDb, sql } from '@repo/db';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ service: 'AdrRepository' });

export class DrizzleAdrRepository implements IAdrRepository {
  constructor(private database: DrizzleDb = db) {}

  async findByProjectId(projectId: string): Promise<Result<Adr[], ApplicationError>> {
    try {
      const result = await this.database
        .select()
        .from(adrs)
        .where(eq(adrs.projectId, projectId))
        .orderBy(asc(adrs.adrNumber));

      return ok(result.map((a) => this.mapToDomain(a))) as Result<Adr[], ApplicationError>;
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
      const result = await this.database
        .select()
        .from(adrs)
        .where(and(eq(adrs.projectId, projectId), eq(adrs.adrNumber, adrNumber)))
        .limit(1);

      if (result.length === 0) {
        return ok(null) as Result<Adr | null, ApplicationError>;
      }

      return ok(this.mapToDomain(result[0])) as Result<Adr | null, ApplicationError>;
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
      const result = await this.database
        .update(adrs)
        .set(data)
        .where(and(eq(adrs.projectId, projectId), eq(adrs.adrNumber, adrNumber)))
        .returning();

      if (result.length === 0) {
        return err(new NotFoundError('ADR not found'));
      }

      return ok(this.mapToDomain(result[0])) as Result<Adr, ApplicationError>;
    } catch (error) {
      logger.error('Failed to update ADR', error);
      return err(new DatabaseError('Failed to update ADR'));
    }
  }

  async countCompleteCore(projectId: string): Promise<Result<{ total: number; complete: number }, ApplicationError>> {
    try {
      const result = await this.database
        .select()
        .from(adrs)
        .where(and(eq(adrs.projectId, projectId), sql`${adrs.adrNumber} < ${CORE_ADR_COUNT}`));

      const complete = result.filter((a) => a.status === 'complete').length;
      return ok({ total: result.length, complete }) as Result<{ total: number; complete: number }, ApplicationError>;
    } catch (error) {
      logger.error('Failed to count core ADRs', error);
      return err(new DatabaseError('Failed to count core ADRs'));
    }
  }

  private mapToDomain(a: typeof adrs.$inferSelect): Adr {
    return {
      id: a.id,
      projectId: a.projectId,
      adrNumber: a.adrNumber,
      title: a.title,
      content: a.content,
      status: a.status as AdrStatus,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    };
  }
}

export { DrizzleAdrRepository as PrismaAdrRepository };
