/**
 * PRD Domain Entity
 *
 * Represents a Product Requirements Document version.
 * Pure domain model.
 */

export type PrdStatus = 'draft' | 'final' | 'generated';

export interface PrdVersion {
  id: string;
  projectId: string;
  versionNumber: number;
  content: Record<string, unknown> | null;
  status: PrdStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface PrdVersionWithRelations extends PrdVersion {
  shareLinks: { id: string; token: string; enabled: boolean }[];
  questionHistoryCount: number;
}

/**
 * Minimal PRD payload for anonymous share viewers — excludes project/workspace identifiers
 * and internal version metadata (no ids, no owner, no question history).
 */
export interface AnonymousSharedPrdReadModel {
  versionNumber: number;
  content: Record<string, unknown> | null;
}

/** Persisted read-only share artifact for a PRD version (owner-minted) */
export interface MintedShareLink {
  id: string;
  prdVersionId: string;
  token: string;
  enabled: boolean;
  createdAt: Date;
  disabledAt: Date | null;
}
