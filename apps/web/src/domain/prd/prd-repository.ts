/**
 * PRD Repository Port
 */

import type { PrdVersionContent } from '@repo/contracts/prd';
import {
  AnonymousSharedPrdSnapshot,
  MintShareLinkOptions,
  MintedShareLink,
  PrdVersion,
  PrdVersionWithRelations,
  ShareLinkGate,
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
    content: PrdVersionContent | null
  ): Promise<Result<{ created: boolean; version: PrdVersion }, ApplicationError>>;

  /**
   * Ensures an active read-only share link exists for the PRD version.
   * Returns the existing enabled link or creates one; 404-equivalent when the version is missing
   * or not owned by the user.
   */
  mintReadOnlyShareLink(
    prdVersionId: string,
    ownerUserId: string,
    options?: MintShareLinkOptions
  ): Promise<Result<MintedShareLink, ApplicationError>>;

  getShareLinkGateByToken(token: string): Promise<Result<ShareLinkGate, ApplicationError>>;

  verifyShareLinkPassword(token: string, password: string): Promise<Result<boolean, ApplicationError>>;

  /**
   * Disables a share link when it exists and belongs to the owner's project.
   * Idempotent when already disabled. 404-equivalent when missing or not owned.
   */
  revokeReadOnlyShareLink(
    shareLinkId: string,
    ownerUserId: string
  ): Promise<Result<MintedShareLink, ApplicationError>>;

  /** Enabled share token only; must not touch projects or owner-scoped tables. */
  getAnonymousPrdVersionByShareToken(
    token: string
  ): Promise<Result<AnonymousSharedPrdSnapshot, ApplicationError>>;

  /** Owner-scoped PRD version lookup; not-found when missing or not owned (no existence leak). */
  findVersionByIdForOwner(
    prdVersionId: string,
    ownerUserId: string
  ): Promise<Result<PrdVersion | null, ApplicationError>>;
}
