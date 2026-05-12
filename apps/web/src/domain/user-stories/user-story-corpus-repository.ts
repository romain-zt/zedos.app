/**
 * User story corpus repository port
 */

import { Result } from '@repo/result';
import { ApplicationError } from '@shared/errors/application-error';
import {
  SaveUserStoryLineInput,
  UserStoryCorpusDomain,
} from './user-story-corpus';

export interface IUserStoryCorpusRepository {
  findByProjectAndCluster(
    projectId: string,
    featureSplitClusterId: string
  ): Promise<Result<UserStoryCorpusDomain | null, ApplicationError>>;

  /**
   * Upsert corpus row for the cluster (one corpus per cluster) and replace line rows in one transaction.
   */
  save(
    projectId: string,
    featureSplitClusterId: string,
    lines: SaveUserStoryLineInput[]
  ): Promise<Result<UserStoryCorpusDomain, ApplicationError>>;

  markReviewReady(
    projectId: string,
    featureSplitClusterId: string
  ): Promise<Result<UserStoryCorpusDomain, ApplicationError>>;
}
