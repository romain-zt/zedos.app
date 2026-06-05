import { describe, it, expect } from 'vitest';
import {
  buildPackageFiles,
  buildWorkQueueMarkdown,
  zipPackageFiles,
} from './cursor-package-assembler';
import type { ExportEligibleBundle } from '@domain/delivery/export-bundle';
import type { DecisionsExportJson } from '@repo/contracts/decisions/decision';

const sampleBundle = (): ExportEligibleBundle => ({
  id: 'bundle-abc123',
  projectId: 'proj-1',
  storyTitle: 'Checkout flow',
  storyBody: 'As a buyer, I want to pay.',
  lockedAt: new Date('2026-05-01'),
  taskCount: 1,
  tasks: [
    {
      id: 'task-1',
      sortOrder: 0,
      title: 'Add route',
      promptBody: 'Implement checkout API.',
    },
  ],
});

describe('cursor-package-assembler', () => {
  it('builds PD-001 paths including WORK_QUEUE and per-story files', () => {
    const files = buildPackageFiles([sampleBundle()]);
    const paths = files.map((f) => f.path);
    expect(paths).toContain('WORK_QUEUE.md');
    expect(paths).toContain('.cursor/README.md');
    expect(paths).toContain('docs/execution/user-stories/bundle-abc123.md');
    expect(buildWorkQueueMarkdown([sampleBundle()])).toContain('Checkout flow');
  });

  it('includes decisions.json when export payload is provided', () => {
    const decisionsExport: DecisionsExportJson = {
      version: 1,
      projectId: 'proj-1',
      exportedAt: '2026-06-05T10:00:00.000Z',
      decisions: [
        {
          question: 'Who is the primary user?',
          chosenOption: 'SMB founders',
          rejectedOptions: ['Enterprise IT'],
          ownerComment: null,
          aiInterpretation: null,
          sectionIds: ['Target Users'],
          createdAt: '2026-06-01T12:00:00.000Z',
        },
      ],
    };
    const files = buildPackageFiles([sampleBundle()], decisionsExport);
    const decisionsFile = files.find((f) => f.path === 'decisions.json');
    expect(decisionsFile).toBeDefined();
    expect(decisionsFile?.content).toContain('SMB founders');
  });

  it('produces a non-empty ZIP buffer', async () => {
    const files = buildPackageFiles([sampleBundle()]);
    const zip = await zipPackageFiles(files);
    expect(zip.length).toBeGreaterThan(22);
    expect(zip[0]).toBe(0x50);
    expect(zip[1]).toBe(0x4b);
  });
});
