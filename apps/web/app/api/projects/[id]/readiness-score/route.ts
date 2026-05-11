export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { requireUser } from '@repo/auth/guards'
import { QuestionReadinessScoreResponseSchema } from '@repo/contracts/questions'
import { fetchProjectReadinessScore } from './readiness-score-data'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const userResult = await requireUser(await headers())
    if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const lookup = await fetchProjectReadinessScore(params.id, userResult.unwrap().id)
    if (lookup.ok === false) {
      return NextResponse.json({ error: lookup.error }, { status: lookup.status })
    }
    const validated = QuestionReadinessScoreResponseSchema.safeParse(lookup.data)
    if (!validated.success) {
      console.error('Readiness score outbound validation failed:', validated.error.flatten())
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
    return NextResponse.json(validated.data)
  } catch (e) {
    console.error('Readiness score GET error:', e)
    return NextResponse.json({ error: 'Failed to fetch readiness score' }, { status: 500 })
  }
}
