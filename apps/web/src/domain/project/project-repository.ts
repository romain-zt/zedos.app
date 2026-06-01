/**
 * Project Repository Port
 *
 * Defines the contract for project persistence.
 * Domain depends on this interface; infrastructure implements it.
 */

import type { PrdVersionContent } from '@repo/contracts/prd';
import { Project } from './project';
import { Result } from '@repo/result';
import { ApplicationError } from '@shared/errors/application-error';

export interface ProjectWithCounts extends Project {
  latestPrdVersion?: { versionNumber: number; content: PrdVersionContent } | null;
  prdVersionCount: number;
  questionHistoryCount: number;
}

export interface IProjectRepository {
  findById(projectId: string): Promise<Result<Project, ApplicationError>>;
  findByIdAndUserId(projectId: string, userId: string): Promise<Result<Project, ApplicationError>>;
  findAllByUserId(userId: string): Promise<Result<ProjectWithCounts[], ApplicationError>>;
  create(project: Project): Promise<Result<Project, ApplicationError>>;
  update(project: Project): Promise<Result<Project, ApplicationError>>;
  delete(projectId: string): Promise<Result<void, ApplicationError>>;
}
