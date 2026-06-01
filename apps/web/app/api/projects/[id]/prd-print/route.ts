export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import { DrizzlePrdRepository } from '@infrastructure/persistence/prd-repository';
import { buildPrdPrintHtml } from '@infrastructure/prd/prd-print-html';
import { GeneratePrdAiResponseSchema } from '@repo/contracts/ai/generate-prd-stream';

export async function GET(request: NextRequest, { params: _params }: { params: { id: string } }) {
  const userResult = await requireUser(await headers());
  if (userResult.isErr()) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const versionId = request.nextUrl.searchParams.get('versionId');
  if (!versionId) {
    return new NextResponse('versionId is required', { status: 400 });
  }

  const repo = new DrizzlePrdRepository();
  const versionResult = await repo.findVersionByIdForOwner(versionId, userResult.unwrap().id);
  if (versionResult.isErr() || !versionResult.unwrap()) {
    return new NextResponse('Not found', { status: 404 });
  }

  const version = versionResult.unwrap()!;
  const parsed = GeneratePrdAiResponseSchema.safeParse(version.content);
  const title = parsed.success ? parsed.data.title : 'PRD';

  const html = buildPrdPrintHtml({
    title,
    versionNumber: version.versionNumber,
    content: version.content,
  });

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
