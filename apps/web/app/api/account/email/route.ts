export const dynamic = 'force-dynamic';

import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { requireUser } from '@repo/auth/guards';
import { db, users, accounts, and, eq } from '@repo/db';
import { UpdateEmailRequestSchema } from '@repo/contracts';
import { sendEmailChangeNotice } from '@repo/mail';

export async function POST(request: Request) {
  const requestHeaders = await headers();
  const userResult = await requireUser(requestHeaders);
  if (userResult.isErr()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parseResult = UpdateEmailRequestSchema.safeParse(await request.json());
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parseResult.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const user = userResult.unwrap();
  const { newEmail } = parseResult.data;

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

  return NextResponse.json({
    ok: true,
    message: 'Email updated',
  });
}
