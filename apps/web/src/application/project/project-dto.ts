import type { Project } from '@domain/project/project';
import type { ProjectDTO } from '@repo/contracts/project/project-contracts';
import type { TemplateSlug } from '@repo/contracts/templates';

export function toProjectDTO(project: Project, templateSlug?: TemplateSlug): ProjectDTO {
  return {
    id: project.id,
    userId: project.userId,
    name: project.name,
    description: project.description,
    phase: project.phase,
    journeyMode: project.journeyMode,
    architectureStartedAt: project.architectureStartedAt,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    ...(templateSlug ? { templateSlug } : {}),
  };
}
