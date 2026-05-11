export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import {
  AnonymousSharedPrdResponseSchema,
  ShareReadTokenParamSchema,
} from '@repo/contracts/share/anonymous-read';
import { GetAnonymousSharedPrdUseCase } from '@application/prd/get-anonymous-shared-prd-usecase';
import { PrismaPrdRepository } from '@infrastructure/persistence/prd-repository';
import {
  ApplicationError,
  DatabaseError,
  ExternalServiceError,
  NotFoundError,
} from '@shared/errors/application-error';

function mapApplicationError(error: ApplicationError) {
  if (error instanceof NotFoundError) {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }
  const status =
    typeof error.statusCode === 'number' && error.statusCode >= 400 && error.statusCode < 600
      ? error.statusCode
      : 500;
  return NextResponse.json({ error: 'Something went wrong' }, { status });
}

export async function GET(_request: NextRequest, { params }: { params: { token: string } }) {
  const tokenParsed = ShareReadTokenParamSchema.safeParse(params.token);
  if (!tokenParsed.success) {
    return NextResponse.json({ error: 'Invalid link' }, { status: 400 });
  }

  const useCase = new GetAnonymousSharedPrdUseCase(new PrismaPrdRepository());
  const result = await useCase.execute(tokenParsed.data);
  if (result.isErr()) {
    const e = result.error;
    if (!(e instanceof NotFoundError || e instanceof ExternalServiceError || e instanceof DatabaseError)) {
      console.error('Share GET:', e);
    }
    return mapApplicationError(e);
  }

  const snap = result.unwrap();
  const out = AnonymousSharedPrdResponseSchema.safeParse({
    versionNumber: snap.versionNumber,
    content: snap.content,
    status: snap.status,
    createdAt: snap.createdAt,
  });
  if (!out.success) {
    console.error('Share GET outbound validation', out.error.flatten());
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }

  return NextResponse.json(out.data);
}
