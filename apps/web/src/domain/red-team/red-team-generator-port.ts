/**
 * Port for the AI red-team finding generator. Vendor SDK + prompt template live in
 * `infrastructure/ai/red-team-report-generator-adapter.ts`.
 */

import type { Result } from '@repo/result';
import type { ApplicationError } from '@shared/errors/application-error';
import type { PrdVersion } from '@domain/prd/prd';
import type { RedTeamFindingDraft } from './red-team-report';

export interface RedTeamGeneratorInput {
  prd: PrdVersion;
  projectName: string;
}

export interface IRedTeamGenerator {
  generate(input: RedTeamGeneratorInput): Promise<Result<RedTeamFindingDraft[], ApplicationError>>;
}
