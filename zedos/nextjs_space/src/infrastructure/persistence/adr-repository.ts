/**
 * Prisma ADR Repository Adapter
 */

import { IAdrRepository } from '@domain/adr/adr-repository';
import { Adr, CORE_ADR_COUNT } from '@domain/adr/adr';
import { Result, ok, err } from '@shared/result/result';
import { ApplicationError, NotFoundError, DatabaseError } from '@shared/errors/application-error';
import { PrismaClient } from '@prisma/client';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ service: 'AdrRepository' });

export class PrismaAdrRepository implements IAdrRepository {
  constructor(private prisma: PrismaClient) {}

  async findByProjectId(projectId: string): Promise<Result<Adr[], ApplicationError>> {
    try {
      const adrs = await this.prisma.adr.findMany({
        where: { projectId },
        orderBy: { adrNumber: 'asc' },
      });
      return ok(adrs.map((a: any) => this.mapToDomain(a))) as any;
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
      const adr = await this.prisma.adr.findUnique({
        where: { projectId_adrNumber: { projectId, adrNumber } },
      });
      if (!adr) return ok(null) as any;
      return ok(this.mapToDomain(adr)) as any;
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
      const adr = await this.prisma.adr.update({
        where: { projectId_adrNumber: { projectId, adrNumber } },
        data,
      });
      return ok(this.mapToDomain(adr)) as any;
    } catch (error) {
      logger.error('Failed to update ADR', error);
      return err(new DatabaseError('Failed to update ADR'));
    }
  }

  async countCompleteCore(projectId: string): Promise<Result<{ total: number; complete: number }, ApplicationError>> {
    try {
      const adrs = await this.prisma.adr.findMany({
        where: { projectId, adrNumber: { lt: CORE_ADR_COUNT } },
      });
      const complete = adrs.filter((a) => a.status === 'complete').length;
      return ok({ total: adrs.length, complete }) as any;
    } catch (error) {
      logger.error('Failed to count core ADRs', error);
      return err(new DatabaseError('Failed to count core ADRs'));
    }
  }

  private mapToDomain(a: any): Adr {
    return {
      id: a.id,
      projectId: a.projectId,
      adrNumber: a.adrNumber,
      title: a.title,
      content: a.content,
      status: a.status,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    };
  }
}
