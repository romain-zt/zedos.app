import { describe, it, expect, vi } from 'vitest';
import { BuildDeliveryPackageUseCase } from './build-delivery-package-usecase';
import { buildPackageFiles } from '@infrastructure/delivery/cursor-package-assembler';
import { ok } from '@repo/result';
import type { IProjectRepository } from '@domain/project/project-repository';
import type { IDeliveryExportRepository } from '@domain/delivery/delivery-export-repository';
import type { ICursorPackageAssembler } from '@domain/delivery/cursor-package-assembler-port';
import type { ExportEligibleBundle } from '@domain/delivery/export-bundle';
import type { Project } from '@domain/project/project';

const baseProject = (): Project => ({
  id: 'proj-1',
  userId: 'user-1',
  name: 'Test',
  description: null,
  phase: 'intake',
  journeyMode: 'standard',
  architectureStartedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const sampleBundle = (): ExportEligibleBundle => ({
  id: 'bundle-abc',
  projectId: 'proj-1',
  storyTitle: 'Checkout flow',
  storyBody: 'As a buyer, I want to pay so that I can complete purchase.',
  lockedAt: new Date('2026-05-01'),
  taskCount: 2,
  tasks: [
    {
      id: 'task-1',
      sortOrder: 0,
      title: 'Add checkout route',
      promptBody: 'Implement POST /api/checkout with zod validation.',
    },
    {
      id: 'task-2',
      sortOrder: 1,
      title: 'Wire Stripe session',
      promptBody: 'Create Stripe Checkout Session and return URL.',
    },
  ],
});

const makeProjectRepo = (): IProjectRepository => ({
  findById: vi.fn(),
  findByIdAndUserId: vi.fn().mockResolvedValue(ok(baseProject())),
  findAllByUserId: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
});

const makeDeliveryRepo = (bundles: ExportEligibleBundle[]): IDeliveryExportRepository => ({
  listLockedBundlesByProject: vi.fn(),
  findLockedBundlesByIds: vi.fn().mockResolvedValue(ok(bundles)),
});

const makeAssembler = (): ICursorPackageAssembler => ({
  assembleZip: vi.fn().mockResolvedValue(Buffer.from('PK\x03\x04mock-zip')),
});

describe('BuildDeliveryPackageUseCase', () => {
  it('rejects empty bundle selection', async () => {
    const useCase = new BuildDeliveryPackageUseCase(
      makeProjectRepo(),
      makeDeliveryRepo([]),
      makeAssembler()
    );
    const result = await useCase.execute('proj-1', 'user-1', []);
    expect(result.isErr()).toBe(true);
  });

  it('returns a zip buffer when bundles are valid', async () => {
    const bundle = sampleBundle();
    const useCase = new BuildDeliveryPackageUseCase(
      makeProjectRepo(),
      makeDeliveryRepo([bundle]),
      makeAssembler()
    );
    const result = await useCase.execute('proj-1', 'user-1', [bundle.id]);
    expect(result.isOk()).toBe(true);
    const build = result.unwrap();
    expect(build.zipBuffer.length).toBeGreaterThan(0);
    expect(build.filename).toContain('zedos-delivery');
  });
});

describe('PD-001 package files (assembler)', () => {
  it('includes WORK_QUEUE rows and per-story markdown', () => {
    const files = buildPackageFiles([sampleBundle()]);
    const workQueue = files.find((f) => f.path === 'WORK_QUEUE.md');
    const storyFile = files.find((f) => f.path.includes('docs/execution/user-stories/'));
    expect(workQueue?.content).toContain('DEL-');
    expect(workQueue?.content).toContain('Add checkout route');
    expect(storyFile?.content).toContain('Implement POST /api/checkout');
    expect(storyFile?.content).toContain('Wire Stripe session');
  });
});
