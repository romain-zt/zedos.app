/**
 * Port: AI-backed draft generation for user stories (infrastructure provides the adapter).
 */

import { Result } from '@repo/result';
import { ApplicationError } from '@shared/errors/application-error';

export type UserStoryClusterSummary = {
  label: string;
  valueLine: string;
  boundaryCue: string;
};

export type UserStoryDraftItem = {
  title: string;
  body: string;
  sortOrder?: number;
};

export interface IUserStoryDraftGenerator {
  draftFromCluster(
    cluster: UserStoryClusterSummary
  ): Promise<Result<{ stories: UserStoryDraftItem[] }, ApplicationError>>;
}
