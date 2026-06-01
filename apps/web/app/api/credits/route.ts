/**
 * Credits Info API Route
 *
 * Thin HTTP adapter layer.
 */

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import { DrizzleCreditsRepository } from '@infrastructure/persistence/credits-repository';
import { toNextErrorResponse, catchUnknownError } from '@shared/http';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'credits' });

export async function GET() {
  let userId: string | undefined;
  try {
    const userResult = await requireUser(await headers());
    if (userResult.isErr()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    userId = userResult.unwrap().id;

    const creditsRepository = new DrizzleCreditsRepository();

    const balanceResult = await creditsRepository.getBalance(userId);
    if (balanceResult.isErr()) {
      logger.warn('Credits balance fetch failed', {
        userId,
        statusCode: balanceResult.error.statusCode,
      });
      return toNextErrorResponse(balanceResult.error);
    }
    const balance = balanceResult.unwrap();

    const transactionsResult = await creditsRepository.getTransactionHistory(userId, 50);
    if (transactionsResult.isErr()) {
      logger.warn('Credits history fetch failed', {
        userId,
        statusCode: transactionsResult.error.statusCode,
      });
      return toNextErrorResponse(transactionsResult.error);
    }
    const transactions = transactionsResult.unwrap();

    return NextResponse.json({
      creditBalance: balance.amount,
      graceUsed: balance.graceUsed,
      starterCreditsGranted: false,
      recentTransactions: transactions,
    });
  } catch (error: unknown) {
    return catchUnknownError(error, 'Failed to fetch credits');
  }
}
