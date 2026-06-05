/**
 * Red-team report persistence port.
 */

import type { Result } from '@repo/result';
import type { ApplicationError } from '@shared/errors/application-error';
import type {
  RedTeamReport,
  RedTeamReportWithFindings,
  RedTeamFindingDraft,
} from './red-team-report';

export interface CreatePendingReportInput {
  projectId: string;
  prdVersionId: string;
  requestedByUserId: string;
  creditCost: number;
}

export interface CompleteReportInput {
  reportId: string;
  findings: RedTeamFindingDraft[];
}

export interface FailReportInput {
  reportId: string;
  errorMessage: string;
}

export interface IRedTeamReportRepository {
  createPending(input: CreatePendingReportInput): Promise<Result<RedTeamReport, ApplicationError>>;

  complete(
    input: CompleteReportInput,
  ): Promise<Result<RedTeamReportWithFindings, ApplicationError>>;

  fail(input: FailReportInput): Promise<Result<RedTeamReport, ApplicationError>>;

  listByProject(
    projectId: string,
    requestedByUserId: string,
  ): Promise<Result<RedTeamReport[], ApplicationError>>;

  findByIdForOwner(
    reportId: string,
    requestedByUserId: string,
  ): Promise<Result<RedTeamReportWithFindings | null, ApplicationError>>;
}
