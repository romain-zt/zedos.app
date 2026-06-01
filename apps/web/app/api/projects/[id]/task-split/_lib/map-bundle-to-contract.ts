import type { TaskSplitBundleDomain } from '@domain/task-split/task-split-bundle';

/** Maps domain bundle to HTTP DTO shape for `TaskSplitBundleSchema`. */
export function mapTaskSplitBundleDomainToDto(bundle: TaskSplitBundleDomain) {
  return {
    id: bundle.id,
    projectId: bundle.projectId,
    userStoryLineId: bundle.userStoryLineId,
    storyTitle: bundle.storyTitle,
    storyBody: bundle.storyBody,
    lockedAt: bundle.lockedAt,
    createdAt: bundle.createdAt,
    updatedAt: bundle.updatedAt,
    tasks: bundle.tasks.map((task) => ({
      id: task.id,
      sortOrder: task.sortOrder,
      title: task.title,
      promptBody: task.promptBody,
      manual: task.manual,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    })),
  };
}
