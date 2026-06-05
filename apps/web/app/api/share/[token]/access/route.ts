export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import {
  ShareAccessRequestSchema,
  ShareAccessResponseSchema,
} from '@repo/contracts/share/access';
import { DrizzlePrdRepository } from '@infrastructure/persistence/prd-repository';
import { createLogger } from '@shared/observability/logger';
import { ShareReadTokenParamSchema } from '@repo/contracts/share/anonymous-read';

const logger = createLogger({ operation: 'share/access' });
const SHARE_UNLOCK_COOKIE = 'zedos_share_unlock';

export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  const tokenParsed = ShareReadTokenParamSchema.safeParse(params.token);
  if (!tokenParsed.success) {
    return NextResponse.json({ error: 'Invalid link' }, { status: 400 });
  }
  const token = tokenParsed.data;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = ShareAccessRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const repo = new DrizzlePrdRepository();
  const gateResult = await repo.getShareLinkGateByToken(token);
  if (gateResult.isErr()) {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }
  const gate = gateResult.unwrap();
  if (gate.expired) {
    return NextResponse.json({ error: 'Link expired' }, { status: 404 });
  }
  if (!gate.requiresPassword) {
    const out = ShareAccessResponseSchema.safeParse({ ok: true });
    if (!out.success) {
      return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
    return NextResponse.json(out.data);
  }

  const verifyResult = await repo.verifyShareLinkPassword(token, parsed.data.password);
  if (verifyResult.isErr()) {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }
  if (!verifyResult.unwrap()) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
  }

  const out = ShareAccessResponseSchema.safeParse({ ok: true });
  if (!out.success) {
    logger.error('Share access outbound validation failed');
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }

  const response = NextResponse.json(out.data);
  response.cookies.set(SHARE_UNLOCK_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
