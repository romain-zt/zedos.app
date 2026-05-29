/** Task split bundle — domain types (aligned with Drizzle tables, not HTTP DTOs). */

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
  sourceUserStoryKey: string | null;
  storyTitleSnapshot: string | null;
  lockedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  tasks: TaskSplitTaskDomain[];
}

/** Persist payload from application layer (id optional for new rows). */
export interface SaveTaskInput {
  id?: string;
  sortOrder: number;
  title: string;
  promptBody: string;
  manual?: boolean;
}
