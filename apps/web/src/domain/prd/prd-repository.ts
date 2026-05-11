/**
 * PRD Repository Port
 */

import {
  AnonymousSharedPrdReadModel,
  MintedShareLink,
  PrdVersion,
  PrdVersionWithRelations,
} from './prd';
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

  /**
   * Ensures an active read-only share link exists for the PRD version.
   * Returns the existing enabled link or creates one; 404-equivalent when the version is missing
   * or not owned by the user.
   */
  mintReadOnlyShareLink(
    prdVersionId: string,
    ownerUserId: string
  ): Promise<Result<MintedShareLink, ApplicationError>>;

  /**
   * Resolves an enabled share token to the linked PRD version content only.
   * Does not load project name, project id, or question history.
   */
  findAnonymousSharedPrdByToken(
    token: string
  ): Promise<Result<AnonymousSharedPrdReadModel, ApplicationError>>;
}
