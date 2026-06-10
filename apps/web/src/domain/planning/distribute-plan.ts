import type { TicketDTO } from '@repo/contracts/tickets';

export interface PlannedMilestoneDraft {
  title: string;
  description: string | null;
  startsOn: string; // yyyy-mm-dd
  dueOn: string; // yyyy-mm-dd
  color: string | null;
  sortOrder: number;
}

export interface PlannedAssignment {
  ticketId: string;
  milestoneIndex: number;
  dueDate: string; // yyyy-mm-dd
}

export interface DistributedPlan {
  milestones: PlannedMilestoneDraft[];
  assignments: PlannedAssignment[];
}

const MILESTONE_COLORS = ['violet', 'sky', 'amber', 'emerald', 'pink', 'orange'];
const DEFAULT_ESTIMATE = 2;
const CAPACITY_PER_MILESTONE = 10;
const MILESTONE_LENGTH_DAYS = 7;

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

/** Next Monday (UTC) strictly after `from`, or `from` itself when it is a Monday. */
export function nextMonday(from: Date): Date {
  const date = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  const day = date.getUTCDay();
  const offset = day === 1 ? 0 : (8 - day) % 7;
  return addDays(date, offset);
}

/**
 * Pure delivery-plan distribution (Milo's heuristic):
 * - Only tickets without a milestone are planned (human pins are respected).
 * - Tickets keep board order; done tickets are skipped.
 * - Weekly milestones are filled to a points capacity (estimate ?? 2).
 * - Each ticket's due date = its milestone's end date.
 */
export function distributePlan(
  tickets: TicketDTO[],
  options: { startDate: Date; existingMilestoneCount?: number },
): DistributedPlan {
  const plannable = tickets.filter(
    (ticket) => ticket.milestoneId === null && ticket.status !== 'done',
  );
  if (plannable.length === 0) {
    return { milestones: [], assignments: [] };
  }

  const start = nextMonday(options.startDate);
  const offset = options.existingMilestoneCount ?? 0;

  const milestones: PlannedMilestoneDraft[] = [];
  const assignments: PlannedAssignment[] = [];

  let milestoneIndex = -1;
  let capacityUsed = 0;

  const openMilestone = () => {
    milestoneIndex += 1;
    capacityUsed = 0;
    const startsOn = addDays(start, milestoneIndex * MILESTONE_LENGTH_DAYS);
    const dueOn = addDays(startsOn, MILESTONE_LENGTH_DAYS - 1);
    milestones.push({
      title: `Sprint ${offset + milestoneIndex + 1}`,
      description: null,
      startsOn: toIsoDate(startsOn),
      dueOn: toIsoDate(dueOn),
      color: MILESTONE_COLORS[(offset + milestoneIndex) % MILESTONE_COLORS.length],
      sortOrder: offset + milestoneIndex,
    });
  };

  for (const ticket of plannable) {
    const cost = Math.max(1, ticket.estimate ?? DEFAULT_ESTIMATE);
    if (milestoneIndex === -1 || (capacityUsed > 0 && capacityUsed + cost > CAPACITY_PER_MILESTONE)) {
      openMilestone();
    }
    capacityUsed += cost;
    assignments.push({
      ticketId: ticket.id,
      milestoneIndex,
      dueDate: milestones[milestoneIndex].dueOn,
    });
  }

  return { milestones, assignments };
}
