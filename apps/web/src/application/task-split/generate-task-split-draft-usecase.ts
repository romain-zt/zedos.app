import { IProjectRepository } from '@domain/project/project-repository';
import { ITaskSplitBundleRepository } from '@domain/task-split/task-split-bundle-repository';
import { IPrdRepository } from '@domain/prd/prd-repository';
import type { ITaskSplitGenerator } from '@domain/task-split/task-split-generator';
import type { TaskSplitBundleDomain } from '@domain/task-split/task-split-bundle';
import type { GenerateTaskSplitRequest } from '@repo/contracts/task-split';
import { Result, ok, err } from '@repo/result';
import { ApplicationError, ExternalServiceError } from '@shared/errors/application-error';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'GenerateTaskSplitDraftUseCase' });

export class GenerateTaskSplitDraftUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private bundleRepository: ITaskSplitBundleRepository,
    private prdRepository: IPrdRepository,
    private generator: ITaskSplitGenerator
  ) {}

  async execute(
    projectId: string,
    userId: string,
    input: GenerateTaskSplitRequest
  ): Promise<Result<TaskSplitBundleDomain, ApplicationError>> {
    const projectResult = await this.projectRepository.findByIdAndUserId(projectId, userId);
    if (projectResult.isErr()) {
      logger.warn('Project not found or unauthorized', { projectId, userId });
      return err(projectResult.error);
    }
    const project = projectResult.unwrap();

    const prdVersionsResult = await this.prdRepository.findByProjectId(projectId);
    if (prdVersionsResult.isErr()) return err(prdVersionsResult.error);

    const prdVersions = prdVersionsResult.unwrap();
    const latestPrd = prdVersions.sort((a, b) => b.versionNumber - a.versionNumber)[0];

    const projectContext = buildProjectContext(project.name, latestPrd?.content ?? null);
    const storySummary = buildStorySummary(input.storyTitleSnapshot ?? null);

    const generateResult = await this.generator.generate(storySummary, projectContext);
    if (generateResult.isErr()) {
      logger.error('AI generation failed', { projectId, error: generateResult.error.message });
      return err(generateResult.error);
    }

    const generatedTasks = generateResult.unwrap();
    if (generatedTasks.length === 0) {
      return err(new ExternalServiceError('AI', 'AI returned no tasks', 502));
    }

    const tasks = generatedTasks.map((t, i) => ({
      sortOrder: i,
      title: t.title,
      promptBody: t.promptBody,
      manual: false as const,
    }));

    return this.bundleRepository.save(projectId, tasks, {
      sourceUserStoryKey: input.sourceUserStoryKey ?? null,
      storyTitleSnapshot: input.storyTitleSnapshot ?? null,
    });
  }
}

function buildProjectContext(
  projectName: string,
  prdContent: Record<string, unknown> | null
): string {
  let ctx = `Project: ${projectName}`;
  if (prdContent) {
    const summary = extractPrdSummary(prdContent);
    if (summary) ctx += `\n\nPRD summary:\n${summary}`;
  }
  return ctx;
}

function extractPrdSummary(content: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(content)) {
    if (typeof value === 'string' && value.trim()) {
      parts.push(`${key}: ${value.trim().slice(0, 300)}`);
    }
  }
  return parts.slice(0, 6).join('\n');
}

function buildStorySummary(storyTitleSnapshot: string | null): string {
  if (storyTitleSnapshot) {
    return `User story: ${storyTitleSnapshot}`;
  }
  return 'Generate implementation tasks for this project based on the PRD.';
}
