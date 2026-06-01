export const dynamic = 'force-dynamic';

import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { requireSession } from '@repo/auth/guards';
import { db, sessions, eq, and, desc } from '@repo/db';
import {
  RevokeSessionRequestSchema,
  type UserSession,
} from '@repo/contracts';
import { createLogger } from '@shared/observability/logger';
import { redactOpaqueId, validationFailureData } from '@shared/observability/log-safe';

const logger = createLogger({ operation: 'account/sessions' });

export async function GET() {
  const sessionResult = await requireSession(await headers());
  if (sessionResult.isErr()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const current = sessionResult.unwrap();
  const currentToken = current.session.token;
  const userId = current.user.id;

  try {
    const rows = await db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, userId))
      .orderBy(desc(sessions.createdAt));

    const items: UserSession[] = rows.map((row) => ({
      token: row.token,
      ipAddress: row.ipAddress ?? null,
      userAgent: row.userAgent ?? null,
      createdAt: row.createdAt.toISOString(),
      expiresAt: row.expiresAt.toISOString(),
      current: row.token === currentToken,
    }));

    return NextResponse.json({ sessions: items });
  } catch (error: unknown) {
    logger.withContext({ userId }).error('Account sessions GET failed', error);
    return NextResponse.json({ error: 'Failed to list sessions' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const sessionResult = await requireSession(await headers());
  if (sessionResult.isErr()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parseResult = RevokeSessionRequestSchema.safeParse(await request.json());
  if (!parseResult.success) {
    logger.warn('Account session revoke validation failed', validationFailureData(parseResult.error.flatten()));
    return NextResponse.json(
      { error: 'Validation failed', details: parseResult.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const token = parseResult.data.token;
  const userId = sessionResult.unwrap().user.id;

  try {
    await db
      .delete(sessions)
      .where(and(eq(sessions.userId, userId), eq(sessions.token, token)));

    logger.info('Account session revoked', { userId, sessionToken: redactOpaqueId(token) });
    return NextResponse.json({
      ok: true,
      message: 'Session revoked',
    });
  } catch (error: unknown) {
    logger.withContext({ userId }).error('Account session revoke failed', error);
    return NextResponse.json({ error: 'Failed to revoke session' }, { status: 500 });
  }
}
