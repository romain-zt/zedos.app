/**
 * Bridges IUserStoryDraftGenerator to the validated AI user-story draft helper.
 */

import type {
  IUserStoryDraftGenerator,
  UserStoryClusterSummary,
  UserStoryDraftItem,
} from '@domain/user-stories/user-story-draft-generator';
import { Result, ok, err } from '@repo/result';
import { ApplicationError, ExternalServiceError } from '@shared/errors/application-error';
import { draftOutlinesForCluster, draftSingleStoryForCluster } from './user-story-draft';

export class UserStoryDraftGeneratorAdapter implements IUserStoryDraftGenerator {
  async draftOutlines(
    cluster: UserStoryClusterSummary
  ): Promise<Result<{ outlines: { title: string }[] }, ApplicationError>> {
    const result = await draftOutlinesForCluster(cluster);
    if (result.isErr()) return err(result.error);
    const outlines = result.unwrap();
    const normalizedOutlines: { title: string }[] = [];
    for (const outline of outlines) {
      const title = outline?.title?.trim();
      if (!title) {
        return err(new ExternalServiceError('AI', 'AI returned an outline without title'));
      }
      normalizedOutlines.push({ title });
    }
    return ok({ outlines: normalizedOutlines });
  }

  async draftSingleStory(
    cluster: UserStoryClusterSummary,
    outline: { title: string },
    sortOrder: number
  ): Promise<Result<UserStoryDraftItem, ApplicationError>> {
    const result = await draftSingleStoryForCluster(cluster, outline, sortOrder);
    if (result.isErr()) return err(result.error);
    const story = result.unwrap();
    const title = story?.title?.trim();
    const body = story?.body?.trim();
    if (!title || !body) {
      return err(new ExternalServiceError('AI', 'AI returned an invalid user story draft'));
    }
    return ok({
      title,
      body,
      sortOrder: story.sortOrder ?? sortOrder,
    });
  }
}
