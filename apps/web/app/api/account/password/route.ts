export const dynamic = 'force-dynamic';

import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { requireUser } from '@repo/auth/guards';
import { auth } from '@repo/auth/server';
import { UpdatePasswordRequestSchema } from '@repo/contracts';
import { sendPasswordChangeNotice } from '@repo/mail';

export async function POST(request: Request) {
  const requestHeaders = await headers();
  const userResult = await requireUser(requestHeaders);
  if (userResult.isErr()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parseResult = UpdatePasswordRequestSchema.safeParse(await request.json());
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parseResult.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

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
    return NextResponse.json(
      { error: 'Current password is invalid or operation failed' },
      { status: 400 },
    );
  }

  await sendPasswordChangeNotice({
    to: userResult.unwrap().email,
  });

  return NextResponse.json({
    ok: true,
    message: 'Password updated',
  });
}
