export const dynamic = 'force-dynamic';

import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { requireUser } from '@repo/auth/guards';
import { db, users, accounts, and, eq } from '@repo/db';
import { UpdateEmailRequestSchema } from '@repo/contracts';
import { sendEmailChangeNotice } from '@repo/mail';
import { createLogger } from '@shared/observability/logger';
import { validationFailureData } from '@shared/observability/log-safe';

const logger = createLogger({ operation: 'account/email' });

export async function POST(request: Request) {
  const requestHeaders = await headers();
  const userResult = await requireUser(requestHeaders);
  if (userResult.isErr()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parseResult = UpdateEmailRequestSchema.safeParse(await request.json());
  if (!parseResult.success) {
    logger.warn('Account email POST validation failed', validationFailureData(parseResult.error.flatten()));
    return NextResponse.json(
      { error: 'Validation failed', details: parseResult.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const user = userResult.unwrap();
  const { newEmail } = parseResult.data;

  try {
    await db
      .update(users)
      .set({ email: newEmail })
      .where(eq(users.id, user.id));
    await db
      .update(accounts)
      .set({ accountId: newEmail })
      .where(and(eq(accounts.userId, user.id), eq(accounts.providerId, 'credential')));

    await sendEmailChangeNotice({
      to: user.email,
      newEmail,
    });

    logger.info('Account email updated', { userId: user.id });
    return NextResponse.json({
      ok: true,
      message: 'Email updated',
    });
  } catch (error: unknown) {
    logger.withContext({ userId: user.id }).error('Account email POST failed', error);
    return NextResponse.json({ error: 'Failed to update email' }, { status: 500 });
  }
}
