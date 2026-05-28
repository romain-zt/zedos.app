export const dynamic = 'force-dynamic';

import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { requireUser } from '@repo/auth/guards';
import { db, users, eq, sql } from '@repo/db';
import { UpdateConsentRequestSchema } from '@repo/contracts';

export async function GET() {
  const userResult = await requireUser(await headers());
  if (userResult.isErr()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = userResult.unwrap().id;
  const [row] = await db
    .select({
      marketingConsent: users.marketingConsent,
      productUpdatesConsent: users.productUpdatesConsent,
      consentUpdatedAt: users.consentUpdatedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({
    marketingConsent: row.marketingConsent,
    productUpdatesConsent: row.productUpdatesConsent,
    consentUpdatedAt: row.consentUpdatedAt ? row.consentUpdatedAt.toISOString() : null,
  });
}

export async function POST(request: Request) {
  const userResult = await requireUser(await headers());
  if (userResult.isErr()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parseResult = UpdateConsentRequestSchema.safeParse(await request.json());
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parseResult.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { marketingConsent, productUpdatesConsent } = parseResult.data;
  await db.execute(sql`
    update users
    set marketing_consent = ${marketingConsent},
        product_updates_consent = ${productUpdatesConsent},
        consent_updated_at = now()
    where id = ${userResult.unwrap().id}
  `);

  return NextResponse.json({
    ok: true,
    message: 'Consent settings updated',
  });
}
