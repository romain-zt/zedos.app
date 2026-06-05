import type { Result } from '@repo/result';
import type { ApplicationError } from '@shared/errors/application-error';

export interface CreateLinearIssueInput {
  readonly teamId: string;
  readonly linearProjectId: string | null;
  readonly title: string;
  readonly description: string;
}

export interface CreateLinearIssueOutput {
  readonly linearIssueId: string;
  readonly linearIssueIdentifier: string;
}

/**
 * Vendor-agnostic port for the Linear API. Infrastructure implements with a
 * stub (v1) and later with a real GraphQL client.
 */
export interface ILinearApiPort {
  createIssue(
    input: CreateLinearIssueInput,
  ): Promise<Result<CreateLinearIssueOutput, ApplicationError>>;
}
