/**
 * User story corpus — domain types (aligned with Drizzle tables, not HTTP DTOs).
 */

export interface UserStoryLineDomain {
  id: string;
  corpusId: string;
  sortOrder: number;
  title: string;
  body: string;
  archivedAt: Date | null;
  draftMarker: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserStoryCorpusDomain {
  id: string;
  projectId: string;
  featureSplitClusterId: string;
  reviewReadyAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  lines: UserStoryLineDomain[];
}

/** Persist payload from application layer (ids optional for new rows). */
export interface SaveUserStoryLineInput {
  id?: string;
  sortOrder: number;
  title: string;
  body: string;
  archivedAt?: Date | null;
  draftMarker?: string | null;
}
