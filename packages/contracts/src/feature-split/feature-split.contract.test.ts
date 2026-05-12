import { describe, it, expect } from 'vitest';
import {
  FeatureClusterDraftInputSchema,
  FeatureClusterSchema,
  ConfirmFeatureSplitRequestSchema,
  FeatureSplitConfirmedSchema,
  FeatureSplitDraftSchema,
  FeatureSplitDTOSchema,
  FeatureSplitListResponseSchema,
  GetFeatureSplitsQuerySchema,
  SaveFeatureSplitDraftRequestSchema,
} from './feature-split';
import {
  FeatureSplitProposalSchema,
  ProposeFeatureSplitRequestSchema,
  ProposeFeatureSplitResponseSchema,
} from '../ai/feature-split-proposal';

const clusterPersisted = {
  id: 'clu_1',
  sortOrder: 0,
  label: 'Payments',
  valueLine: 'Take money reliably',
  boundaryCue: 'Stops at checkout capture',
};

const clusterInput = {
  sortOrder: 0,
  label: 'Payments',
  valueLine: 'Take money reliably',
  boundaryCue: 'Stops at checkout capture',
};

describe('FeatureClusterSchema', () => {
  it('accepts a valid persisted cluster', () => {
    expect(FeatureClusterSchema.safeParse(clusterPersisted).success).toBe(true);
  });

  it('rejects empty label', () => {
    expect(
      FeatureClusterSchema.safeParse({ ...clusterPersisted, label: '' }).success,
    ).toBe(false);
  });
});

describe('FeatureClusterDraftInputSchema', () => {
  it('accepts draft input without id', () => {
    expect(FeatureClusterDraftInputSchema.safeParse(clusterInput).success).toBe(true);
  });
});

describe('FeatureSplitDraftSchema / FeatureSplitConfirmedSchema', () => {
  const draft = {
    id: 'fs_1',
    projectId: 'prj_1',
    sourcePrdVersionId: 'prdver_1',
    status: 'draft' as const,
    clusters: [clusterPersisted],
    createdAt: '2026-05-12T10:00:00.000Z',
    updatedAt: '2026-05-12T10:00:00.000Z',
  };

  const confirmed = { ...draft, status: 'confirmed' as const };

  it('parses draft', () => {
    expect(FeatureSplitDraftSchema.safeParse(draft).success).toBe(true);
  });

  it('parses confirmed', () => {
    expect(FeatureSplitConfirmedSchema.safeParse(confirmed).success).toBe(true);
  });

  it('parses discriminated FeatureSplitDTOSchema', () => {
    expect(FeatureSplitDTOSchema.safeParse(draft).success).toBe(true);
    expect(FeatureSplitDTOSchema.safeParse(confirmed).success).toBe(true);
  });

  it('rejects wrong status literal for draft schema', () => {
    expect(FeatureSplitDraftSchema.safeParse(confirmed).success).toBe(false);
  });
});

describe('FeatureSplitListResponseSchema', () => {
  it('accepts empty list', () => {
    expect(FeatureSplitListResponseSchema.safeParse([]).success).toBe(true);
  });
});

describe('GetFeatureSplitsQuerySchema', () => {
  it('accepts empty query', () => {
    expect(GetFeatureSplitsQuerySchema.safeParse({}).success).toBe(true);
  });

  it('accepts optional sourcePrdVersionId', () => {
    expect(
      GetFeatureSplitsQuerySchema.safeParse({ sourcePrdVersionId: 'prdver_1' }).success,
    ).toBe(true);
  });
});

describe('SaveFeatureSplitDraftRequestSchema', () => {
  it('accepts save draft payload', () => {
    expect(
      SaveFeatureSplitDraftRequestSchema.safeParse({
        sourcePrdVersionId: 'prdver_1',
        clusters: [clusterInput],
      }).success,
    ).toBe(true);
  });

  it('rejects empty clusters array', () => {
    expect(
      SaveFeatureSplitDraftRequestSchema.safeParse({
        sourcePrdVersionId: 'prdver_1',
        clusters: [],
      }).success,
    ).toBe(false);
  });
});

describe('ConfirmFeatureSplitRequestSchema', () => {
  it('accepts confirm body', () => {
    expect(
      ConfirmFeatureSplitRequestSchema.safeParse({ featureSplitId: 'fs_1' }).success,
    ).toBe(true);
  });
});

describe('FeatureSplitProposalSchema', () => {
  const validProposal = {
    clusters: [
      {
        sortOrder: 0,
        label: 'A',
        valueLine: 'V',
        boundaryCue: 'B',
      },
    ],
  };

  it('parses AI proposal clusters', () => {
    expect(FeatureSplitProposalSchema.safeParse(validProposal).success).toBe(true);
  });

  it('rejects zero clusters', () => {
    expect(FeatureSplitProposalSchema.safeParse({ clusters: [] }).success).toBe(false);
  });
});

describe('ProposeFeatureSplitRequestSchema', () => {
  it('parses propose request', () => {
    expect(
      ProposeFeatureSplitRequestSchema.safeParse({ sourcePrdVersionId: 'prdver_1' })
        .success,
    ).toBe(true);
  });
});

describe('ProposeFeatureSplitResponseSchema', () => {
  it('parses propose response', () => {
    expect(
      ProposeFeatureSplitResponseSchema.safeParse({
        proposal: {
          clusters: [
            {
              sortOrder: 0,
              label: 'A',
              valueLine: 'V',
              boundaryCue: 'B',
            },
          ],
        },
        creditsDeducted: 2,
      }).success,
    ).toBe(true);
  });

  it('parses response without creditsDeducted', () => {
    expect(
      ProposeFeatureSplitResponseSchema.safeParse({
        proposal: {
          clusters: [{ sortOrder: 0, label: 'A', valueLine: 'V', boundaryCue: 'B' }],
        },
      }).success,
    ).toBe(true);
  });
});
