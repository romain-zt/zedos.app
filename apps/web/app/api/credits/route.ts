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

export async function GET() {
  try {
    const userResult = await requireUser(await headers());
    if (userResult.isErr()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = userResult.unwrap().id;

    const creditsRepository = new DrizzleCreditsRepository();

    const balanceResult = await creditsRepository.getBalance(userId);
    if (balanceResult.isErr()) {
      return toNextErrorResponse(balanceResult.error);
    }
    const balance = balanceResult.unwrap();

    const transactionsResult = await creditsRepository.getTransactionHistory(userId, 50);
    if (transactionsResult.isErr()) {
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
