export const dynamic = 'force-dynamic';

import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { requireUser } from '@repo/auth/guards';
import { auth } from '@repo/auth/server';
import { UpdatePasswordRequestSchema } from '@repo/contracts';
import { sendPasswordChangeNotice } from '@repo/mail';
import { createLogger } from '@shared/observability/logger';
import { validationFailureData } from '@shared/observability/log-safe';

const logger = createLogger({ operation: 'account/password' });

export async function POST(request: Request) {
  const requestHeaders = await headers();
  const userResult = await requireUser(requestHeaders);
  if (userResult.isErr()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parseResult = UpdatePasswordRequestSchema.safeParse(await request.json());
  if (!parseResult.success) {
    logger.warn('Account password POST validation failed', validationFailureData(parseResult.error.flatten()));
    return NextResponse.json(
      { error: 'Validation failed', details: parseResult.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const userId = userResult.unwrap().id;
  const { currentPassword, newPassword, revokeOtherSessions } = parseResult.data;
  try {
    await auth.api.changePassword({
      headers: requestHeaders,
      body: {
        currentPassword,
        newPassword,
        revokeOtherSessions,
      },
    });
  } catch {
    logger.warn('Account password change rejected', { userId });
    return NextResponse.json(
      { error: 'Current password is invalid or operation failed' },
      { status: 400 },
    );
  }

  try {
    await sendPasswordChangeNotice({
      to: userResult.unwrap().email,
    });

    logger.info('Account password updated', { userId });
    return NextResponse.json({
      ok: true,
      message: 'Password updated',
    });
  } catch (error: unknown) {
    logger.withContext({ userId }).error('Account password POST failed', error);
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
  }
}
