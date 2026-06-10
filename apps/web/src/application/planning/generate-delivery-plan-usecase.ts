import { Result, err, ok } from '@repo/result';
import { ApplicationError, ValidationError } from '@shared/errors/application-error';
import type { MilestoneDTO } from '@repo/contracts/planning';
import type { TicketDTO } from '@repo/contracts/tickets';
import type { IMilestoneRepository } from '@domain/planning/milestone-repository';
import type { ITicketRepository } from '@domain/tickets/ticket-repository';
import type { IAgentActivityRepository } from '@domain/team/team-repository';
import type { IProjectRepository } from '@domain/project/project-repository';
import { distributePlan } from '@domain/planning/distribute-plan';
import { RecordAgentActivityUseCase } from '@application/team/record-agent-activity-usecase';

export interface GenerateDeliveryPlanResult {
  milestones: MilestoneDTO[];
  tickets: TicketDTO[];
}

/**
 * Milo (engineering manager) plans delivery:
 *   1. Verify project ownership
 *   2. Distribute unassigned, not-done tickets into weekly sprints
 *      (pure heuristic — human-pinned milestones are never touched)
 *   3. Persist sprints + ticket assignments
 *   4. Records agent activity around the run
 */
export class GenerateDeliveryPlanUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private ticketRepository: ITicketRepository,
    private milestoneRepository: IMilestoneRepository,
    private activityRepository: IAgentActivityRepository,
    private now: () => Date = () => new Date(),
  ) {}

  async execute(input: {
    projectId: string;
    userId: string;
  }): Promise<Result<GenerateDeliveryPlanResult, ApplicationError>> {
    const projectResult = await this.projectRepository.findByIdAndUserId(
      input.projectId,
      input.userId,
    );
    if (projectResult.isErr()) return err(projectResult.error);

    const ticketsResult = await this.ticketRepository.listByProject(input.projectId);
    if (ticketsResult.isErr()) return err(ticketsResult.error);
    const ticketList = ticketsResult.unwrap();
    if (ticketList.length === 0) {
      return err(new ValidationError('No tickets to plan yet — create tickets on the board first'));
    }

    const existingMilestones = await this.milestoneRepository.listByProject(input.projectId);
    if (existingMilestones.isErr()) return err(existingMilestones.error);

    const plan = distributePlan(ticketList, {
      startDate: this.now(),
      existingMilestoneCount: existingMilestones.unwrap().length,
    });
    if (plan.milestones.length === 0) {
      return err(
        new ValidationError('Everything is already planned — move tickets out of a sprint to re-plan'),
      );
    }

    const activity = new RecordAgentActivityUseCase(this.activityRepository);
    const activityId = await activity.startSafe({
      projectId: input.projectId,
      kind: 'plan_generation',
      summary: `Milo is planning delivery across ${plan.milestones.length} sprint${plan.milestones.length === 1 ? '' : 's'}`,
    });

    const persisted = await this.persistPlan(input.projectId, plan);
    if (persisted.isErr()) {
      await activity.finishSafe(activityId, 'failed', 'Delivery planning failed');
      return err(persisted.error);
    }

    await activity.finishSafe(
      activityId,
      'completed',
      `Milo planned ${plan.assignments.length} tickets across ${plan.milestones.length} sprint${plan.milestones.length === 1 ? '' : 's'}`,
    );
    return ok(persisted.unwrap());
  }

  private async persistPlan(
    projectId: string,
    plan: ReturnType<typeof distributePlan>,
  ): Promise<Result<GenerateDeliveryPlanResult, ApplicationError>> {
    const createdMilestones = await this.milestoneRepository.createMany(
      projectId,
      plan.milestones,
    );
    if (createdMilestones.isErr()) return err(createdMilestones.error);
    const milestoneRows = createdMilestones.unwrap();

    const assignments = plan.assignments
      .filter((assignment) => milestoneRows[assignment.milestoneIndex] !== undefined)
      .map((assignment) => ({
        ticketId: assignment.ticketId,
        milestoneId: milestoneRows[assignment.milestoneIndex].id,
        dueDate: assignment.dueDate,
      }));

    const assigned = await this.ticketRepository.bulkAssign(projectId, assignments);
    if (assigned.isErr()) return err(assigned.error);

    const refreshedTickets = await this.ticketRepository.listByProject(projectId);
    if (refreshedTickets.isErr()) return err(refreshedTickets.error);

    return ok({ milestones: milestoneRows, tickets: refreshedTickets.unwrap() });
  }
}
