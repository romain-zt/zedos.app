/**
 * Project Domain Service
 *
 * Pure domain logic for project operations.
 * No I/O, no external dependencies.
 */

import type { PrdVersionContent } from '@repo/contracts/prd';
import type { GeneratePrdSection } from '@repo/contracts/ai/generate-prd-stream';
import { Project, ProjectPhase } from './project';

// These IDs match the section `id` values produced by the AI PRD generation prompt.
const PRD_REQUIRED_SECTIONS = [
  'vision',
  'target_users',
  'core_features',
  'user_journeys',
  'technical',
  'success_metrics',
  'out_of_scope',
  'risks',
] as const;

/**
 * Minimum number of filled sections required to consider a PRD "stable"
 * and eligible for architecture phase unlock.
 */
const MIN_STABLE_THRESHOLD = 4;

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
   */
  static checkPrdStability(prdContent: PrdVersionContent | null): {
    isStable: boolean;
    filledCount: number;
    totalRequired: number;
  } {
    if (!prdContent) {
      return { isStable: false, filledCount: 0, totalRequired: PRD_REQUIRED_SECTIONS.length };
    }

    let filledCount: number;

    if ('sections' in prdContent && Array.isArray(prdContent.sections) && prdContent.sections.length > 0) {
      const filledIds = new Set(
        prdContent.sections
          .filter((s: GeneratePrdSection) => s.content.trim().length > 0)
          .map((s) => s.id)
      );
      filledCount = PRD_REQUIRED_SECTIONS.filter((id) => filledIds.has(id)).length;
    } else if (!('source' in prdContent) && !('title' in prdContent)) {
      // Intake map: top-level keys match section slugs directly.
      const intake = prdContent as Record<string, string>;
      filledCount = PRD_REQUIRED_SECTIONS.filter((section) => {
        const val = intake[section];
        return typeof val === 'string' && val.trim().length > 0;
      }).length;
    } else {
      filledCount = 0;
    }

    return {
      isStable: filledCount >= MIN_STABLE_THRESHOLD,
      filledCount,
      totalRequired: PRD_REQUIRED_SECTIONS.length,
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
