/**
 * Feature Split domain types
 */

export type FeatureClusterStatus = 'draft' | 'confirmed';

export interface FeatureClusterDomain {
  id: string;
  featureSplitId: string;
  sortOrder: number;
  label: string;
  valueLine: string;
  boundaryCue: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeatureSplitDomain {
  id: string;
  projectId: string;
  sourcePrdVersionId: string;
  status: FeatureClusterStatus;
  clusters: FeatureClusterDomain[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NewFeatureClusterInput {
  sortOrder: number;
  label: string;
  valueLine: string;
  boundaryCue: string;
}
