export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { requireUser } from '@repo/auth/guards'
import {
  CreateShareLinkRequestSchema,
  ShareLinkMintResponseSchema,
} from '@repo/contracts/share/mint'
import { MintReadOnlyShareLinkUseCase } from '@application/prd'
import { PrismaPrdRepository } from '@infrastructure/persistence/prd-repository'

export async function POST(request: NextRequest) {
  const userResult = await requireUser(headers())
  if (userResult.isErr()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = userResult.unwrap().id

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = CreateShareLinkRequestSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const useCase = new MintReadOnlyShareLinkUseCase(new PrismaPrdRepository())
  const result = await useCase.execute(parsed.data.prdVersionId, userId)
  if (result.isErr()) {
    const e = result.error
    return NextResponse.json({ error: e.message }, { status: e.statusCode })
  }

  const link = result.unwrap()
  const out = ShareLinkMintResponseSchema.safeParse({
    id: link.id,
    prdVersionId: link.prdVersionId,
    token: link.token,
    enabled: link.enabled,
    createdAt: link.createdAt,
    disabledAt: link.disabledAt,
  })
  if (!out.success) {
    console.error('Share mint outbound validation failed', out.error.flatten())
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  return NextResponse.json(out.data, { status: 200 })
}
