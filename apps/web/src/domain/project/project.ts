/**
 * Project Domain Entity
 *
 * Represents a Zedos project in the domain layer.
 * Pure domain model — no Prisma types leak here.
 */

export type ProjectPhase = 'intake' | 'architecture';

export type JourneyMode = 'standard' | 'express';

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  phase: ProjectPhase;
  journeyMode: JourneyMode;
  architectureStartedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * ProjectId value object
 */
export class ProjectId {
  constructor(readonly value: string) {
    if (!value || value.trim() === '') {
      throw new Error('ProjectId cannot be empty');
    }
  }

  equals(other: ProjectId): boolean {
    return this.value === other.value;
  }
}
