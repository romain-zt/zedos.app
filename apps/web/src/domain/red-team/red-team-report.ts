/**
 * Adversarial PRD red-team review entities.
 */

import type {
  RedTeamCategory,
  RedTeamSeverity,
  RedTeamReportStatus,
} from '@repo/contracts/ai';

export type { RedTeamCategory, RedTeamSeverity, RedTeamReportStatus };

export interface RedTeamFinding {
  id: string;
  sortOrder: number;
  category: RedTeamCategory;
  severity: RedTeamSeverity;
  sectionId: string | null;
  title: string;
  evidence: string;
  suggestion: string;
  metadata: Record<string, string>;
}

export interface RedTeamReport {
  id: string;
  projectId: string;
  prdVersionId: string;
  requestedByUserId: string;
  status: RedTeamReportStatus;
  creditCost: number;
  findingCount: number;
  errorMessage: string | null;
  createdAt: Date;
  completedAt: Date | null;
}

export interface RedTeamReportWithFindings extends RedTeamReport {
  findings: RedTeamFinding[];
}

/** Pre-persist shape — id assigned by repository. */
export interface RedTeamFindingDraft {
  sortOrder: number;
  category: RedTeamCategory;
  severity: RedTeamSeverity;
  sectionId: string | null;
  title: string;
  evidence: string;
  suggestion: string;
  metadata: Record<string, string>;
}
