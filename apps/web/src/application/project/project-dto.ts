import type { Project } from '@domain/project/project';
import type { ProjectDTO } from '@repo/contracts/project/project-contracts';

export function toProjectDTO(project: Project): ProjectDTO {
  return {
    id: project.id,
    userId: project.userId,
    name: project.name,
    description: project.description,
    phase: project.phase,
    architectureStartedAt: project.architectureStartedAt,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}
