/**
 * PRD Repository Port
 */

import { PrdVersion, PrdVersionWithRelations } from './prd';
import { Result } from '@repo/result';
import { ApplicationError } from '@shared/errors/application-error';

export interface IPrdRepository {
  findByProjectId(projectId: string): Promise<Result<PrdVersionWithRelations[], ApplicationError>>;
  findLatestByProjectId(projectId: string): Promise<Result<PrdVersion | null, ApplicationError>>;
}
