/**
 * PRD Repository Port
 */

import { PrdVersion, PrdVersionWithRelations } from './prd';
import { Result } from '@repo/result';
import { ApplicationError } from '@shared/errors/application-error';

export interface IPrdRepository {
  findByProjectId(projectId: string): Promise<Result<PrdVersionWithRelations[], ApplicationError>>;
  findLatestByProjectId(projectId: string): Promise<Result<PrdVersion | null, ApplicationError>>;
  /**
   * If the project already has any PRD version, returns the latest row unchanged.
   * Otherwise inserts version 1 with the given draft content.
   */
  ensureFirstVersion(
    projectId: string,
    content: Record<string, unknown> | null
  ): Promise<Result<{ created: boolean; version: PrdVersion }, ApplicationError>>;
}
