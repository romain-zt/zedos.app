/**
 * Task-split bundle — domain types (aligned with Drizzle tables, not HTTP DTOs).
 */

export interface TaskSplitTaskDomain {
  id: string;
  bundleId: string;
  sortOrder: number;
  title: string;
  promptBody: string;
  manual: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskSplitBundleDomain {
  id: string;
  projectId: string;
  userStoryLineId: string | null;
  storyTitle: string | null;
  storyBody: string | null;
  lockedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  tasks: TaskSplitTaskDomain[];
}

export interface SaveTaskSplitTaskInput {
  id?: string;
  sortOrder: number;
  title: string;
  promptBody: string;
  manual: boolean;
}

export interface EligibleUserStoryLineSnapshot {
  lineId: string;
  title: string;
  body: string;
}
