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
