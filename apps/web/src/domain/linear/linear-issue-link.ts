export type LinearIssueLinkStatus =
  | 'triage'
  | 'backlog'
  | 'todo'
  | 'in_progress'
  | 'done'
  | 'canceled'
  | 'unknown';

export interface LinearIssueLink {
  readonly id: string;
  readonly projectId: string;
  readonly userStoryLineId: string;
  readonly linearIssueId: string;
  readonly linearIssueIdentifier: string;
  readonly status: LinearIssueLinkStatus;
  readonly lastSyncedAt: Date | null;
  readonly createdAt: Date;
}

export interface LinearIssueLinkDraft {
  readonly projectId: string;
  readonly userStoryLineId: string;
  readonly linearIssueId: string;
  readonly linearIssueIdentifier: string;
  readonly status: LinearIssueLinkStatus;
}
