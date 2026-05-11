export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import {
  AnonymousSharedPrdResponseSchema,
  ShareLinkTokenPathSchema,
} from '@repo/contracts/share/anonymous-read';
import { GetAnonymousSharedPrdUseCase } from '@application/prd';
import { PrismaPrdRepository } from '@infrastructure/persistence/prd-repository';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ service: 'share-read-route' });

export async function GET(_request: NextRequest, { params }: { params: { token: string } }) {
  const parsedToken = ShareLinkTokenPathSchema.safeParse(params.token);
  if (!parsedToken.success) {
    return NextResponse.json({ error: 'Invalid share link' }, { status: 400 });
  }

  const useCase = new GetAnonymousSharedPrdUseCase(new PrismaPrdRepository());
  const result = await useCase.execute(parsedToken.data);
  if (result.isErr()) {
    const e = result.error;
    return NextResponse.json({ error: e.message }, { status: e.statusCode });
  }

  const read = result.unwrap();
  const out = AnonymousSharedPrdResponseSchema.safeParse({
    versionNumber: read.versionNumber,
    content: read.content,
  });
  if (!out.success) {
    logger.error('Anonymous share outbound validation failed', out.error.flatten());
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }

  return NextResponse.json(out.data);
}
