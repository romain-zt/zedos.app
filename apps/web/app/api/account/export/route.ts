export const dynamic = 'force-dynamic';

import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { requireUser } from '@repo/auth/guards';
import {
  db,
  users,
  sessions,
  creditTransactions,
  projects,
  eq,
  desc,
} from '@repo/db';
import { sendPersonalDataExportReady } from '@repo/mail';
import {
  PersonalDataExportResponseSchema,
  type PersonalDataExportResponse,
} from '@repo/contracts';

export async function GET() {
  const userResult = await requireUser(await headers());
  if (userResult.isErr()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = userResult.unwrap();
  const [userRow] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  if (!userRow) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const userSessions = await db
    .select()
    .from(sessions)
    .where(eq(sessions.userId, user.id))
    .orderBy(desc(sessions.createdAt));
  const creditRows = await db
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, user.id))
    .orderBy(desc(creditTransactions.createdAt));
  const projectRows = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, user.id))
    .orderBy(desc(projects.createdAt));

  const payload: PersonalDataExportResponse = {
    generatedAt: new Date().toISOString(),
    user: {
      id: userRow.id,
      email: userRow.email,
      name: userRow.name,
      createdAt: userRow.createdAt.toISOString(),
      updatedAt: userRow.updatedAt.toISOString(),
      marketingConsent: userRow.marketingConsent,
      productUpdatesConsent: userRow.productUpdatesConsent,
      consentUpdatedAt: userRow.consentUpdatedAt ? userRow.consentUpdatedAt.toISOString() : null,
    },
    sessions: userSessions.map((row) => ({
      token: row.token,
      ipAddress: row.ipAddress ?? null,
      userAgent: row.userAgent ?? null,
      createdAt: row.createdAt.toISOString(),
      expiresAt: row.expiresAt.toISOString(),
      current: false,
    })),
    credits: creditRows.map((row) => ({
      id: row.id,
      type: row.type,
      amount: row.amount,
      balanceAfter: row.balanceAfter,
      createdAt: row.createdAt.toISOString(),
    })),
    projects: projectRows.map((row) => ({
      id: row.id,
      name: row.name,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
  };

  const parseResult = PersonalDataExportResponseSchema.safeParse(payload);
  if (!parseResult.success) {
    return NextResponse.json({ error: 'Failed to build export payload' }, { status: 500 });
  }

  await sendPersonalDataExportReady({ to: user.email });

  return new NextResponse(JSON.stringify(parseResult.data, null, 2), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': 'attachment; filename="personal-data-export.json"',
    },
  });
}
