/**
 * PRD Domain Entity
 *
 * Represents a Product Requirements Document version.
 * Pure domain model.
 */

import type { PrdVersionContent } from '@repo/contracts/prd';
import type { PrdDeliverableKind } from '@repo/contracts/prd';

export type PrdStatus = 'draft' | 'final' | 'generated';

export interface PrdVersion {
  id: string;
  projectId: string;
  versionNumber: number;
  content: PrdVersionContent | null;
  status: PrdStatus;
  deliverableKind: PrdDeliverableKind;
  createdAt: Date;
  updatedAt: Date;
}

export interface PrdVersionWithRelations extends PrdVersion {
  shareLinks: { id: string; token: string; enabled: boolean }[];
  questionHistoryCount: number;
}

/** Persisted read-only share artifact for a PRD version (owner-minted) */
export interface MintShareLinkOptions {
  password?: string;
  expiresInDays?: number;
}

export interface MintedShareLink {
  id: string;
  prdVersionId: string;
  token: string;
  enabled: boolean;
  hasPassword: boolean;
  expiresAt: Date | null;
  createdAt: Date;
  disabledAt: Date | null;
}

export interface ShareLinkGate {
  requiresPassword: boolean;
  expired: boolean;
}

/**
 * Minimal PRD projection for anonymous share readers — no project/workspace identifiers.
 */
export interface AnonymousSharedPrdSnapshot {
  versionNumber: number;
  content: PrdVersionContent | null;
  status: PrdStatus;
  deliverableKind: PrdDeliverableKind;
  createdAt: Date;
}
