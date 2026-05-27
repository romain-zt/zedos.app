/**
 * Bridges IUserStoryDraftGenerator to the validated AI user-story draft helper.
 */

import type {
  IUserStoryDraftGenerator,
  UserStoryClusterSummary,
  UserStoryDraftItem,
} from '@domain/user-stories/user-story-draft-generator';
import { Result, ok, err } from '@repo/result';
import { ApplicationError } from '@shared/errors/application-error';
import { draftOutlinesForCluster, draftSingleStoryForCluster } from './user-story-draft';

export class UserStoryDraftGeneratorAdapter implements IUserStoryDraftGenerator {
  async draftOutlines(
    cluster: UserStoryClusterSummary
  ): Promise<Result<{ outlines: { title: string }[] }, ApplicationError>> {
    const result = await draftOutlinesForCluster(cluster);
    if (result.isErr()) return err(result.error);
    return ok({ outlines: result.unwrap() });
  }

  async draftSingleStory(
    cluster: UserStoryClusterSummary,
    outline: { title: string },
    sortOrder: number
  ): Promise<Result<UserStoryDraftItem, ApplicationError>> {
    return draftSingleStoryForCluster(cluster, outline, sortOrder);
  }
}
