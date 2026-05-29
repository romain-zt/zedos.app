/**
 * Domain types for Cursor delivery export (locked task-split bundles).
 */

export type ExportTask = {
  id: string;
  sortOrder: number;
  title: string;
  promptBody: string;
};

export type ExportEligibleBundle = {
  id: string;
  projectId: string;
  storyTitle: string;
  storyBody: string;
  lockedAt: Date;
  taskCount: number;
  tasks: ExportTask[];
};

export const PROMPT_EXCERPT_MAX_LENGTH = 200;

export function excerptPrompt(body: string, maxLength: number = PROMPT_EXCERPT_MAX_LENGTH): string {
  if (body.length <= maxLength) return body;
  return `${body.slice(0, maxLength)}…`;
}
