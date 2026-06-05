/**
 * Domain entity for a project ↔ GitHub repository link.
 *
 * Pure data — no Drizzle types, no Next.js, no vendor SDK. The mapper between
 * this entity and the persisted row lives in the infrastructure layer.
 */
export type GithubConnectionStatus = 'active' | 'disconnected' | 'token_invalid';

export interface GithubConnection {
  readonly id: string;
  readonly projectId: string;
  readonly connectedByUserId: string;
  readonly ownerLogin: string;
  readonly repoName: string;
  readonly installationId: string | null;
  readonly status: GithubConnectionStatus;
  readonly createdAt: Date;
  readonly disconnectedAt: Date | null;
}

export interface GithubConnectionDraft {
  readonly projectId: string;
  readonly connectedByUserId: string;
  readonly ownerLogin: string;
  readonly repoName: string;
  readonly installationId: string | null;
}
