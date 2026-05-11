/**
 * Credits Info API Route
 *
 * Thin HTTP adapter layer.
 * Fetches user credits and transaction history.
 */

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import { DrizzleCreditsRepository } from '@infrastructure/persistence/credits-repository';
import { ApplicationError } from '@shared/errors/application-error';

export async function GET() {
  try {
    // 1. Check authentication
    const userResult = await requireUser(await headers());
    if (userResult.isErr()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = userResult.unwrap().id;

    // 2. Instantiate repository
    const creditsRepository = new DrizzleCreditsRepository();

    // 3. Get balance
    const balanceResult = await creditsRepository.getBalance(userId);
    if (balanceResult.isErr()) {
      const error = balanceResult.error as ApplicationError;
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const balance = balanceResult.unwrap();

    // 4. Get transaction history
    const transactionsResult = await creditsRepository.getTransactionHistory(userId, 50);
    if (transactionsResult.isErr()) {
      const error = transactionsResult.error as ApplicationError;
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const transactions = transactionsResult.unwrap();

    // 5. Return DTO
    return NextResponse.json({
      creditBalance: balance.amount,
      graceUsed: balance.graceUsed,
      starterCreditsGranted: false,
      recentTransactions: transactions,
    });
  } catch (error: any) {
    console.error('Credits GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credits' },
      { status: 500 }
    );
  }
}
