/**
 * ADR Domain Entity
 *
 * Represents an Architectural Decision Record.
 * Pure domain model.
 */

export type AdrStatus = 'draft' | 'complete';

export interface Adr {
  id: string;
  projectId: string;
  adrNumber: number;
  title: string;
  content: string;
  status: AdrStatus;
  createdAt: Date;
  updatedAt: Date;
}

/** The 14 predefined ADR slots (0-13) */
export const ADR_SLOT_COUNT = 14;

/** First 8 (0-7) are core ADRs used for readiness scoring */
export const CORE_ADR_COUNT = 8;
