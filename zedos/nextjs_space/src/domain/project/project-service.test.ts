import { describe, it, expect } from 'vitest';
import { ProjectDomainService } from './project-service';
import { Project } from './project';

const makeProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'proj-1',
  userId: 'user-1',
  name: 'Test Project',
  description: null,
  phase: 'intake',
  architectureStartedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('ProjectDomainService', () => {
  describe('createProject', () => {
    it('creates a project in intake phase', () => {
      const p = ProjectDomainService.createProject('id1', 'user1', ' My Project ', 'desc');
      expect(p.name).toBe('My Project');
      expect(p.phase).toBe('intake');
      expect(p.architectureStartedAt).toBeNull();
    });
  });

  describe('checkPrdStability', () => {
    it('returns unstable for null content', () => {
      const r = ProjectDomainService.checkPrdStability(null);
      expect(r.isStable).toBe(false);
      expect(r.filledCount).toBe(0);
    });

    it('returns unstable for partial content', () => {
      const r = ProjectDomainService.checkPrdStability({ overview: 'yes', problem: 'yes' });
      expect(r.isStable).toBe(false);
      expect(r.filledCount).toBe(2);
    });

    it('returns stable when all 8 sections filled', () => {
      const content: Record<string, string> = {};
      for (const s of ProjectDomainService.requiredPrdSections) {
        content[s] = 'filled';
      }
      const r = ProjectDomainService.checkPrdStability(content);
      expect(r.isStable).toBe(true);
      expect(r.filledCount).toBe(8);
    });

    it('empty string sections are not counted', () => {
      const content: Record<string, string> = {};
      for (const s of ProjectDomainService.requiredPrdSections) {
        content[s] = '';
      }
      const r = ProjectDomainService.checkPrdStability(content);
      expect(r.isStable).toBe(false);
      expect(r.filledCount).toBe(0);
    });
  });

  describe('canUnlockArchitecture', () => {
    it('returns false when not in intake phase', () => {
      const p = makeProject({ phase: 'architecture' });
      const r = ProjectDomainService.canUnlockArchitecture(p, true);
      expect(r.canUnlock).toBe(false);
    });

    it('returns false when PRD not stable', () => {
      const p = makeProject();
      const r = ProjectDomainService.canUnlockArchitecture(p, false);
      expect(r.canUnlock).toBe(false);
    });

    it('returns true when intake + stable PRD', () => {
      const p = makeProject();
      const r = ProjectDomainService.canUnlockArchitecture(p, true);
      expect(r.canUnlock).toBe(true);
    });
  });

  describe('transitionToArchitecture', () => {
    it('sets phase and architectureStartedAt', () => {
      const p = makeProject();
      const t = ProjectDomainService.transitionToArchitecture(p);
      expect(t.phase).toBe('architecture');
      expect(t.architectureStartedAt).toBeInstanceOf(Date);
    });
  });
});
