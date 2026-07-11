import { describe, expect, it } from 'vitest';
import { err, ok } from '@repo/result';
import { DatabaseError } from '@shared/errors/application-error';
import {
  QualifyWaitlistLeadUseCase,
  SubmitWaitlistContactUseCase,
  type WaitlistRepository,
} from './manage-waitlist-usecase';

function createRepository(
  overrides: Partial<WaitlistRepository> = {}
): WaitlistRepository {
  return {
    upsertContact: async () =>
      ok({
        leadId: 'f6310ee8-0842-4ea9-9861-7de8947d822a',
        status: 'created',
      }),
    qualifyLead: async () => ok('f6310ee8-0842-4ea9-9861-7de8947d822a'),
    ...overrides,
  };
}

describe('SubmitWaitlistContactUseCase', () => {
  it('persists a validated contact application', async () => {
    const useCase = new SubmitWaitlistContactUseCase(createRepository());

    const result = await useCase.execute({
      stage: 'contact',
      name: 'Jules Martin',
      email: 'jules@studio.fr',
      businessName: 'Studio Juniper',
      businessType: 'pilates',
      consentToContact: true,
      websiteTrap: '',
    });

    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toEqual({
      leadId: 'f6310ee8-0842-4ea9-9861-7de8947d822a',
      status: 'created',
    });
  });

  it('returns repository failures without hiding them', async () => {
    const useCase = new SubmitWaitlistContactUseCase(
      createRepository({
        upsertContact: async () => err(new DatabaseError('Unavailable')),
      })
    );

    const result = await useCase.execute({
      stage: 'contact',
      name: 'Jules Martin',
      email: 'jules@studio.fr',
      businessName: 'Studio Juniper',
      businessType: 'pilates',
      consentToContact: true,
      websiteTrap: '',
    });

    if (result.isOk()) throw new Error('Expected repository failure');
    expect(result.error.statusCode).toBe(500);
  });
});

describe('QualifyWaitlistLeadUseCase', () => {
  it('returns not found when the contact step was not saved', async () => {
    const useCase = new QualifyWaitlistLeadUseCase(
      createRepository({
        qualifyLead: async () => ok(null),
      })
    );

    const result = await useCase.execute({
      stage: 'qualification',
      leadId: 'f6310ee8-0842-4ea9-9861-7de8947d822a',
      practitionerRange: '2-5',
    });

    if (result.isOk()) throw new Error('Expected missing waitlist application');
    expect(result.error.statusCode).toBe(404);
  });
});
