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

/** Persisted read-only share artifact for a PRD version (owner-minted) */
export interface MintedShareLink {
  id: string;
  prdVersionId: string;
  token: string;
  enabled: boolean;
  createdAt: Date;
  disabledAt: Date | null;
}

/**
 * Minimal PRD projection for anonymous share readers — no project/workspace identifiers.
 */
export interface AnonymousSharedPrdSnapshot {
  versionNumber: number;
  content: Record<string, unknown> | null;
  status: PrdStatus;
  createdAt: Date;
}
