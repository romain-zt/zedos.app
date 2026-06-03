import { describe, it, expect } from 'vitest';
import { ProjectDomainService } from './project-service';
import { Project } from './project';

const makeProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'proj-1',
  userId: 'user-1',
  name: 'Test Project',
  description: null,
  phase: 'intake',
  journeyMode: 'standard',
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
      expect(p.journeyMode).toBe('standard');
      expect(p.architectureStartedAt).toBeNull();
    });

    it('creates a project with express journey mode', () => {
      const p = ProjectDomainService.createProject('id1', 'user1', 'Express', null, 'express');
      expect(p.journeyMode).toBe('express');
    });
  });

  describe('setJourneyMode', () => {
    it('updates journey mode without changing phase', () => {
      const p = makeProject({ journeyMode: 'standard' });
      const updated = ProjectDomainService.setJourneyMode(p, 'express');
      expect(updated.journeyMode).toBe('express');
      expect(updated.phase).toBe('intake');
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(p.updatedAt.getTime());
    });
  });

  describe('checkPrdStability', () => {
    it('returns unstable for null content', () => {
      const r = ProjectDomainService.checkPrdStability(null);
      expect(r.isStable).toBe(false);
      expect(r.filledCount).toBe(0);
    });

    // Legacy flat-key format tests (backward-compat path)
    it('returns unstable for partial flat-key content (< 4 sections)', () => {
      const r = ProjectDomainService.checkPrdStability({ vision: 'yes', target_users: 'yes' });
      expect(r.isStable).toBe(false);
      expect(r.filledCount).toBe(2);
    });

    it('returns stable for flat-key content with >= 4 sections filled', () => {
      const content: Record<string, string> = {};
      for (const s of ProjectDomainService.requiredPrdSections.slice(0, 4)) {
        content[s] = 'filled';
      }
      const r = ProjectDomainService.checkPrdStability(content);
      expect(r.isStable).toBe(true);
      expect(r.filledCount).toBe(4);
    });

    it('returns stable when all 8 flat-key sections filled', () => {
      const content: Record<string, string> = {};
      for (const s of ProjectDomainService.requiredPrdSections) {
        content[s] = 'filled';
      }
      const r = ProjectDomainService.checkPrdStability(content);
      expect(r.isStable).toBe(true);
      expect(r.filledCount).toBe(8);
    });

    it('empty string flat-key sections are not counted', () => {
      const content: Record<string, string> = {};
      for (const s of ProjectDomainService.requiredPrdSections) {
        content[s] = '';
      }
      const r = ProjectDomainService.checkPrdStability(content);
      expect(r.isStable).toBe(false);
      expect(r.filledCount).toBe(0);
    });

    // AI-generated sections-array format tests
    it('counts sections from AI-format sections array by id', () => {
      const content = {
        title: 'My PRD',
        version_summary: 'v1',
        sections: [
          { id: 'vision', title: 'Vision', content: 'We solve X for Y' },
          { id: 'target_users', title: 'Users', content: 'Founders' },
          { id: 'core_features', title: 'Features', content: 'AI PRD' },
          { id: 'user_journeys', title: 'Journeys', content: 'Signup → clarify → PRD' },
        ],
      };
      const r = ProjectDomainService.checkPrdStability(content);
      expect(r.filledCount).toBe(4);
      expect(r.isStable).toBe(true);
    });

    it('sections-array: empty content strings are not counted', () => {
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

    it('sections-array: unknown section ids do not count toward required', () => {
      const content = {
        sections: [
          { id: 'some_unknown_section', content: 'foobar' },
          { id: 'vision', content: 'Product vision here' },
        ],
      };
      const r = ProjectDomainService.checkPrdStability(content);
      expect(r.filledCount).toBe(1);
      expect(r.isStable).toBe(false);
    });

    it('sections-array: full AI PRD with all 8 sections is stable', () => {
      const sections = ProjectDomainService.requiredPrdSections.map((id) => ({
        id,
        content: 'Some content',
      }));
      const r = ProjectDomainService.checkPrdStability({ sections });
      expect(r.filledCount).toBe(8);
      expect(r.isStable).toBe(true);
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
