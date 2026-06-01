export const dynamic = 'force-dynamic';

import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { requireUser } from '@repo/auth/guards';
import { auth } from '@repo/auth/server';
import { db, users, eq } from '@repo/db';
import { DeleteAccountRequestSchema } from '@repo/contracts';
import { sendAccountDeletionNotice } from '@repo/mail';
import { createLogger } from '@shared/observability/logger';
import { validationFailureData } from '@shared/observability/log-safe';

const logger = createLogger({ operation: 'account/delete' });

export async function POST(request: Request) {
  const requestHeaders = await headers();
  const userResult = await requireUser(requestHeaders);
  if (userResult.isErr()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parseResult = DeleteAccountRequestSchema.safeParse(await request.json());
  if (!parseResult.success) {
    logger.warn('Account delete validation failed', validationFailureData(parseResult.error.flatten()));
    return NextResponse.json(
      { error: 'Validation failed', details: parseResult.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const user = userResult.unwrap();

  try {
    await sendAccountDeletionNotice({ to: user.email });
    await db.delete(users).where(eq(users.id, user.id));
    await auth.api.signOut({ headers: requestHeaders });

    logger.info('Account deleted', { userId: user.id });
    return NextResponse.json({
      ok: true,
      message: 'Account deleted',
    });
  } catch (error: unknown) {
    logger.withContext({ userId: user.id }).error('Account delete failed', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
