export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import {
  AnonymousSharedPrdResponseSchema,
  ShareReadTokenParamSchema,
} from '@repo/contracts/share/anonymous-read';
import { SharePasswordRequiredResponseSchema } from '@repo/contracts/share/access';

const SHARE_UNLOCK_COOKIE = 'zedos_share_unlock';
import { GetAnonymousSharedPrdUseCase } from '@application/prd/get-anonymous-shared-prd-usecase';
import { PrismaPrdRepository } from '@infrastructure/persistence/prd-repository';
import {
  ApplicationError,
  DatabaseError,
  ExternalServiceError,
  NotFoundError,
} from '@shared/errors/application-error';
import { createLogger } from '@shared/observability/logger';
import { redactOpaqueId, validationFailureData } from '@shared/observability/log-safe';

const logger = createLogger({ operation: 'share/read' });

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

  const repo = new PrismaPrdRepository();
  const gateResult = await repo.getShareLinkGateByToken(tokenParsed.data);
  if (gateResult.isErr()) {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }
  const gate = gateResult.unwrap();
  if (gate.expired) {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }
  if (gate.requiresPassword) {
    const unlock = _request.cookies.get(SHARE_UNLOCK_COOKIE)?.value;
    if (unlock !== tokenParsed.data) {
      const body = SharePasswordRequiredResponseSchema.safeParse({
        error: 'Password required',
        code: 'SHARE_PASSWORD_REQUIRED',
        requiresPassword: true,
      });
      return NextResponse.json(body.success ? body.data : { error: 'Password required' }, {
        status: 403,
      });
    }
  }

  const useCase = new GetAnonymousSharedPrdUseCase(repo);
  const result = await useCase.execute(tokenParsed.data);
  if (result.isErr()) {
    const e = result.error;
    if (!(e instanceof NotFoundError || e instanceof ExternalServiceError || e instanceof DatabaseError)) {
      logger
        .withContext({ token: redactOpaqueId(tokenParsed.data) })
        .error('Share GET unexpected application error', e);
    }
    return mapApplicationError(e);
  }

  const snap = result.unwrap();
  const out = AnonymousSharedPrdResponseSchema.safeParse({
    versionNumber: snap.versionNumber,
    content: snap.content,
    status: snap.status,
    deliverableKind: snap.deliverableKind,
    createdAt: snap.createdAt,
  });
  if (!out.success) {
    logger
      .withContext({ token: redactOpaqueId(tokenParsed.data) })
      .error('Share GET outbound validation failed', validationFailureData(out.error.flatten()));
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }

  return NextResponse.json(out.data);
}
