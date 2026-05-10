import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProcessStripeWebhookEventUseCase } from './process-stripe-webhook-event-usecase';
import { ok, err } from '@shared/result/result';
import { DatabaseError, ValidationError } from '@shared/errors/application-error';
import validCheckoutFixture from '@contracts/payments/__fixtures__/checkout-session-completed.valid.json';

describe('ProcessStripeWebhookEventUseCase (T-5)', () => {
  let creditsRepo: any;
  let webhookRepo: any;
  let prisma: any;
  let useCase: ProcessStripeWebhookEventUseCase;

  beforeEach(() => {
    creditsRepo = { addCredits: vi.fn() };
    webhookRepo = { recordEvent: vi.fn() };
    prisma = { purchase: { update: vi.fn() } };
    useCase = new ProcessStripeWebhookEventUseCase(creditsRepo, webhookRepo, prisma);
  });

  it('grants credits and updates purchase on valid checkout.session.completed', async () => {
    webhookRepo.recordEvent.mockResolvedValue(ok({ idempotent: false }));
    creditsRepo.addCredits.mockResolvedValue(ok({}));
    prisma.purchase.update.mockResolvedValue({});

    const result = await useCase.execute({ rawEventPayload: validCheckoutFixture });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const output = result.unwrap();
      expect(output.idempotent).toBe(false);
      expect(output.creditsGranted).toBe(100);
      expect(output.userId).toBe('user_placeholder_001');
    }
    expect(creditsRepo.addCredits).toHaveBeenCalledWith(
      'user_placeholder_001',
      100,
      'purchase',
      'evt_test_placeholder_001'
    );
  });

  it('returns Ok({ idempotent: true }) when event was already processed', async () => {
    webhookRepo.recordEvent.mockResolvedValue(ok({ idempotent: true }));

    const result = await useCase.execute({ rawEventPayload: validCheckoutFixture });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.unwrap().idempotent).toBe(true);
    }
    expect(creditsRepo.addCredits).not.toHaveBeenCalled();
  });

  it('returns Err(ValidationError) when event payload fails zod parse', async () => {
    const badPayload = { id: 'evt_bad', type: 'unknown.event.type' };
    const result = await useCase.execute({ rawEventPayload: badPayload });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(ValidationError);
    }
    expect(webhookRepo.recordEvent).not.toHaveBeenCalled();
  });

  it('returns Err when credits repo fails', async () => {
    webhookRepo.recordEvent.mockResolvedValue(ok({ idempotent: false }));
    creditsRepo.addCredits.mockResolvedValue(err(new DatabaseError('db fail')));

    const result = await useCase.execute({ rawEventPayload: validCheckoutFixture });

    expect(result.isErr()).toBe(true);
  });
});
