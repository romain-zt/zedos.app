/**
 * Bridges IUserStoryDraftGenerator to the validated AI user-story draft helper.
 */

import type {
  IUserStoryDraftGenerator,
  UserStoryClusterSummary,
  UserStoryDraftItem,
} from '@domain/user-stories/user-story-draft-generator';
import type { UserStoryAiDraftItem } from '@repo/contracts';
import { Result, ok, err } from '@repo/result';
import { ApplicationError } from '@shared/errors/application-error';
import { draftUserStoriesWithAi } from './user-story-draft';

export class UserStoryDraftGeneratorAdapter implements IUserStoryDraftGenerator {
  async draftFromCluster(
    cluster: UserStoryClusterSummary
  ): Promise<Result<{ stories: UserStoryDraftItem[] }, ApplicationError>> {
    const result = await draftUserStoriesWithAi(cluster);
    if (result.isErr()) return err(result.error);
    const { stories } = result.unwrap();
    const mapped: UserStoryDraftItem[] = stories.map((s: UserStoryAiDraftItem) => ({
      title: s.title,
      body: s.body,
      sortOrder: s.sortOrder,
    }));
    return ok({ stories: mapped });
  }
}
