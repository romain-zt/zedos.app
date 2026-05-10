/**
 * Project Domain Service
 *
 * Pure domain logic for project operations.
 * No I/O, no external dependencies.
 */

import { Project, ProjectPhase } from './project';

const PRD_REQUIRED_SECTIONS = [
  'overview',
  'problem',
  'users',
  'journeys',
  'objects',
  'scope',
  'risks',
  'metrics',
] as const;

export class ProjectDomainService {
  /**
   * Create a new project entity (defaults to intake phase)
   */
  static createProject(
    id: string,
    userId: string,
    name: string,
    description: string | null
  ): Project {
    return {
      id,
      userId,
      name: name.trim(),
      description: description?.trim() || null,
      phase: 'intake',
      architectureStartedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Check if PRD content satisfies stability requirements for phase transition.
   * Returns the count of filled sections and whether all are filled.
   *
   * Supports two formats:
   * - sections-array: { sections: [{ id, content, ... }] } (AI-generated)
   * - flat-key: { overview: "...", problem: "...", ... } (legacy)
   */
  static checkPrdStability(prdContent: Record<string, unknown> | null): {
    isStable: boolean;
    filledCount: number;
    totalRequired: number;
  } {
    const totalRequired = PRD_REQUIRED_SECTIONS.length;

    if (!prdContent) {
      return { isStable: false, filledCount: 0, totalRequired };
    }

    // Sections-array format: { sections: [{ id, content }] }
    if (Array.isArray(prdContent.sections)) {
      const sections = prdContent.sections as Array<Record<string, unknown>>;
      const filledCount = sections.filter((s) => {
        const content = s.content;
        return content && typeof content === 'string' && content.trim().length > 0;
      }).length;
      return {
        isStable: filledCount >= totalRequired,
        filledCount,
        totalRequired,
      };
    }

    // Legacy flat-key format
    const filledCount = PRD_REQUIRED_SECTIONS.filter((section) => {
      const val = prdContent[section];
      return val && (typeof val === 'string' ? val.trim().length > 0 : true);
    }).length;

    return {
      isStable: filledCount === totalRequired,
      filledCount,
      totalRequired,
    };
  }

  /**
   * Determine if a project can transition to architecture phase.
   */
  static canUnlockArchitecture(project: Project, prdIsStable: boolean): {
    canUnlock: boolean;
    reason: string;
  } {
    if (project.phase !== 'intake') {
      return { canUnlock: false, reason: 'Project is not in INTAKE phase' };
    }
    if (!prdIsStable) {
      return { canUnlock: false, reason: 'PRD is not stable. Complete all sections first.' };
    }
    return { canUnlock: true, reason: 'PRD is stable, architecture phase is unlocked' };
  }

  /**
   * Transition project to architecture phase. Returns updated project.
   */
  static transitionToArchitecture(project: Project): Project {
    return {
      ...project,
      phase: 'architecture' as ProjectPhase,
      architectureStartedAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Get the list of required PRD sections.
   */
  static get requiredPrdSections(): readonly string[] {
    return PRD_REQUIRED_SECTIONS;
  }
}
