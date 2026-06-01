import { describe, it, expect } from 'vitest';
import {
  buildPackageFiles,
  buildWorkQueueMarkdown,
  zipPackageFiles,
} from './cursor-package-assembler';
import type { ExportEligibleBundle } from '@domain/delivery/export-bundle';

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

  it('produces a non-empty ZIP buffer', async () => {
    const files = buildPackageFiles([sampleBundle()]);
    const zip = await zipPackageFiles(files);
    expect(zip.length).toBeGreaterThan(22);
    expect(zip[0]).toBe(0x50);
    expect(zip[1]).toBe(0x4b);
  });
});
