import { ITaskSplitBundleRepository } from '@domain/task-split/task-split-bundle-repository';
import type { EligibleUserStoryLineSnapshot } from '@domain/task-split/task-split-bundle';
import { Result, ok, err } from '@repo/result';
import { ApplicationError, NotFoundError } from '@shared/errors/application-error';

export async function requireEligibleStoryLine(
  repository: ITaskSplitBundleRepository,
  projectId: string,
  userStoryLineId: string
): Promise<Result<EligibleUserStoryLineSnapshot, ApplicationError>> {
  const lineResult = await repository.findEligibleStoryLine(projectId, userStoryLineId);
  if (lineResult.isErr()) return err(lineResult.error);
  const line = lineResult.unwrap();
  if (!line) {
    return err(
      new NotFoundError(
        'User story line not found or not review-ready. Finalize user stories upstream.'
      )
    );
  }
  return ok(line);
}
