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

    it('returns unstable for partial content (flat format)', () => {
      const r = ProjectDomainService.checkPrdStability({ overview: 'yes', problem: 'yes' });
      expect(r.isStable).toBe(false);
      expect(r.filledCount).toBe(2);
    });

    it('returns stable when all 8 sections filled (flat format)', () => {
      const content: Record<string, string> = {};
      for (const s of ProjectDomainService.requiredPrdSections) {
        content[s] = 'filled';
      }
      const r = ProjectDomainService.checkPrdStability(content);
      expect(r.isStable).toBe(true);
      expect(r.filledCount).toBe(8);
    });

    it('empty string sections are not counted (flat format)', () => {
      const content: Record<string, string> = {};
      for (const s of ProjectDomainService.requiredPrdSections) {
        content[s] = '';
      }
      const r = ProjectDomainService.checkPrdStability(content);
      expect(r.isStable).toBe(false);
      expect(r.filledCount).toBe(0);
    });

    it('counts filled sections from sections-array format (AI-generated)', () => {
      const content = {
        title: 'ZedCheckout',
        sections: [
          { id: 'vision', content: 'Problem statement...' },
          { id: 'target_users', content: 'Wellness merchants...' },
          { id: 'core_features', content: 'Booking widget...' },
          { id: 'user_journeys', content: 'User books a session...' },
          { id: 'technical', content: 'Next.js + Shopify...' },
          { id: 'success_metrics', content: 'Conversion rate...' },
          { id: 'out_of_scope', content: 'Marketplace listings...' },
          { id: 'risks', content: 'Payment failure...' },
        ],
      };
      const r = ProjectDomainService.checkPrdStability(content);
      expect(r.filledCount).toBe(8);
      expect(r.isStable).toBe(true);
    });

    it('returns unstable for partial sections-array', () => {
      const content = {
        sections: [
          { id: 'vision', content: 'Problem...' },
          { id: 'target_users', content: '' },
          { id: 'core_features', content: 'Features...' },
        ],
      };
      const r = ProjectDomainService.checkPrdStability(content);
      expect(r.filledCount).toBe(2);
      expect(r.isStable).toBe(false);
    });

    it('ignores sections with empty content in sections-array', () => {
      const content = {
        sections: [
          { id: 'vision', content: '' },
          { id: 'target_users', content: '   ' },
        ],
      };
      const r = ProjectDomainService.checkPrdStability(content);
      expect(r.filledCount).toBe(0);
      expect(r.isStable).toBe(false);
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
