export type LinearConnectionStatus = 'active' | 'disconnected' | 'token_invalid';

export interface LinearConnection {
  readonly id: string;
  readonly projectId: string;
  readonly connectedByUserId: string;
  readonly teamId: string;
  readonly linearProjectId: string | null;
  readonly status: LinearConnectionStatus;
  readonly createdAt: Date;
  readonly disconnectedAt: Date | null;
}

export interface LinearConnectionDraft {
  readonly projectId: string;
  readonly connectedByUserId: string;
  readonly teamId: string;
  readonly linearProjectId: string | null;
}
