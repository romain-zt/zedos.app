/**
 * ADR Repository Port
 */

import { Adr } from './adr';
import { Result } from '@repo/result';
import { ApplicationError } from '@shared/errors/application-error';

export interface IAdrRepository {
  findByProjectId(projectId: string): Promise<Result<Adr[], ApplicationError>>;
  findByProjectIdAndNumber(projectId: string, adrNumber: number): Promise<Result<Adr | null, ApplicationError>>;
  update(projectId: string, adrNumber: number, data: { title?: string; content?: string; status?: string }): Promise<Result<Adr, ApplicationError>>;
  countCompleteCore(projectId: string): Promise<Result<{ total: number; complete: number }, ApplicationError>>;
}
