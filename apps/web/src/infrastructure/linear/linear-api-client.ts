import type {
  CreateLinearIssueInput,
  CreateLinearIssueOutput,
  ILinearApiPort,
} from '@domain/linear/linear-api-port';
import { Result, err } from '@repo/result';
import {
  ApplicationError,
  ExternalServiceError,
} from '@shared/errors/application-error';
import { readLinearConfig, type LinearConfig } from './linear-config';

/**
 * v1 minimal Linear API client — vendor-isolated, no @linear/sdk dependency.
 *
 * Behavior in v1:
 *   - When LINEAR_API_KEY is missing → 503 `linear_not_configured`.
 *   - When LINEAR_API_KEY is present → 501 stub (real GraphQL call is deferred
 *     to a follow-up scope slice; we do not want this v1 to silently issue
 *     real Linear writes when an operator sets the env var for testing).
 *
 * The follow-up replaces the 501 branch with a real `fetch` to
 * `https://api.linear.app/graphql` using the `Authorization: <api-key>` header
 * and an `issueCreate` mutation, then maps the response with Zod.
 */
export class LinearApiClient implements ILinearApiPort {
  private readonly config: LinearConfig;

  constructor(config: LinearConfig = readLinearConfig()) {
    this.config = config;
  }

  async createIssue(
    _input: CreateLinearIssueInput,
  ): Promise<Result<CreateLinearIssueOutput, ApplicationError>> {
    if (!this.config.apiKey) {
      return err(
        new ExternalServiceError(
          'linear',
          'Linear is not configured (LINEAR_API_KEY missing)',
          503,
        ),
      );
    }
    return err(
      new ExternalServiceError(
        'linear',
        'Linear push is not implemented in v1 stub — set LINEAR_API_KEY *and* upgrade the client before relying on this path',
        501,
      ),
    );
  }
}

export const linearApiClient = new LinearApiClient();
