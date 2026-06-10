import { describe, it, expect } from 'vitest';
import type { TicketDTO } from '@repo/contracts/tickets';
import { distributePlan, nextMonday } from './distribute-plan';

function ticket(overrides: Partial<TicketDTO> & { id: string }): TicketDTO {
  return {
    projectId: 'p1',
    number: 1,
    key: 'ZED-1',
    title: 'A ticket',
    description: '',
    status: 'todo',
    priority: 'medium',
    estimate: null,
    assigneeRole: null,
    userStoryLineId: null,
    taskSplitTaskId: null,
    milestoneId: null,
    dueDate: null,
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('nextMonday', () => {
  it('returns the same day for a Monday', () => {
    expect(nextMonday(new Date('2026-06-08T10:00:00Z')).toISOString().slice(0, 10)).toBe(
      '2026-06-08',
    );
  });

  it('returns the following Monday otherwise', () => {
    // 2026-06-10 is a Wednesday
    expect(nextMonday(new Date('2026-06-10T10:00:00Z')).toISOString().slice(0, 10)).toBe(
      '2026-06-15',
    );
  });
});

describe('distributePlan', () => {
  const startDate = new Date('2026-06-10T00:00:00Z'); // Wednesday → plan starts 2026-06-15

  it('returns an empty plan when every ticket is pinned or done', () => {
    const plan = distributePlan(
      [ticket({ id: 't1', milestoneId: 'm1' }), ticket({ id: 't2', status: 'done' })],
      { startDate },
    );
    expect(plan.milestones).toHaveLength(0);
    expect(plan.assignments).toHaveLength(0);
  });

  it('fills weekly sprints up to the points capacity', () => {
    const tickets = [
      ticket({ id: 't1', estimate: 5 }),
      ticket({ id: 't2', estimate: 5 }),
      ticket({ id: 't3', estimate: 5 }), // exceeds capacity 10 → sprint 2
    ];
    const plan = distributePlan(tickets, { startDate });

    expect(plan.milestones).toHaveLength(2);
    expect(plan.milestones[0]).toMatchObject({
      title: 'Sprint 1',
      startsOn: '2026-06-15',
      dueOn: '2026-06-21',
    });
    expect(plan.milestones[1]).toMatchObject({
      title: 'Sprint 2',
      startsOn: '2026-06-22',
      dueOn: '2026-06-28',
    });
    expect(plan.assignments.map((a) => a.milestoneIndex)).toEqual([0, 0, 1]);
    expect(plan.assignments[2].dueDate).toBe('2026-06-28');
  });

  it('defaults estimate to 2 points and never splits a single oversized ticket', () => {
    const tickets = [
      ticket({ id: 't1' }), // 2
      ticket({ id: 't2', estimate: 50 }), // oversized → own sprint after t1 (2+50 > 10)
    ];
    const plan = distributePlan(tickets, { startDate });
    expect(plan.milestones).toHaveLength(2);
    expect(plan.assignments[1].milestoneIndex).toBe(1);
  });

  it('continues numbering after existing milestones', () => {
    const plan = distributePlan([ticket({ id: 't1' })], {
      startDate,
      existingMilestoneCount: 3,
    });
    expect(plan.milestones[0].title).toBe('Sprint 4');
    expect(plan.milestones[0].sortOrder).toBe(3);
  });
});
