import { describe, it, expect } from 'vitest';
import { ok, err, Result } from '@repo/result';
import { ApplicationError, DatabaseError } from '@shared/errors/application-error';
import type { AgentActivityDTO } from '@repo/contracts/team';
import type {
  IAgentActivityRepository,
  StartAgentActivityInput,
  CompleteAgentActivityInput,
} from '@domain/team/team-repository';
import { RecordAgentActivityUseCase } from './record-agent-activity-usecase';

class FakeActivityRepository implements IAgentActivityRepository {
  started: StartAgentActivityInput[] = [];
  finished: CompleteAgentActivityInput[] = [];
  failNext = false;

  async start(
    input: StartAgentActivityInput,
  ): Promise<Result<AgentActivityDTO, ApplicationError>> {
    if (this.failNext) return err(new DatabaseError('boom'));
    this.started.push(input);
    return ok({
      id: `activity-${this.started.length}`,
      projectId: input.projectId,
      agentRole: input.agentRole,
      kind: input.kind,
      status: 'running',
      summary: input.summary,
      createdAt: new Date(),
      completedAt: null,
    });
  }

  async finish(input: CompleteAgentActivityInput): Promise<Result<void, ApplicationError>> {
    if (this.failNext) return err(new DatabaseError('boom'));
    this.finished.push(input);
    return ok(undefined);
  }

  async listByProject(): Promise<Result<AgentActivityDTO[], ApplicationError>> {
    return ok([]);
  }
}

describe('RecordAgentActivityUseCase', () => {
  it('attributes activities to the default owner of the kind', async () => {
    const repo = new FakeActivityRepository();
    const useCase = new RecordAgentActivityUseCase(repo);

    const id = await useCase.startSafe({
      projectId: 'p1',
      kind: 'prd_generation',
      summary: 'Drafting PRD',
    });

    expect(id).toBe('activity-1');
    expect(repo.started[0]?.agentRole).toBe('product_manager');
  });

  it('honors an explicit agentRole override', async () => {
    const repo = new FakeActivityRepository();
    const useCase = new RecordAgentActivityUseCase(repo);

    await useCase.startSafe({
      projectId: 'p1',
      kind: 'task_split',
      summary: 'Splitting tasks',
      agentRole: 'backend_dev',
    });

    expect(repo.started[0]?.agentRole).toBe('backend_dev');
  });

  it('startSafe returns null instead of failing when the repository errors', async () => {
    const repo = new FakeActivityRepository();
    repo.failNext = true;
    const useCase = new RecordAgentActivityUseCase(repo);

    const id = await useCase.startSafe({
      projectId: 'p1',
      kind: 'clarification',
      summary: 'Clarifying',
    });

    expect(id).toBeNull();
  });

  it('finishSafe is a no-op for null ids and swallows repository errors', async () => {
    const repo = new FakeActivityRepository();
    const useCase = new RecordAgentActivityUseCase(repo);

    await useCase.finishSafe(null, 'completed');
    expect(repo.finished).toHaveLength(0);

    repo.failNext = true;
    await expect(useCase.finishSafe('a-1', 'failed')).resolves.toBeUndefined();
  });

  it('finishSafe records the terminal status and summary', async () => {
    const repo = new FakeActivityRepository();
    const useCase = new RecordAgentActivityUseCase(repo);

    await useCase.finishSafe('a-1', 'completed', 'All done');

    expect(repo.finished[0]).toEqual({
      activityId: 'a-1',
      status: 'completed',
      summary: 'All done',
    });
  });
});
