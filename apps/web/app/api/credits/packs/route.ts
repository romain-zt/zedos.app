export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getCreditPacks, getCreditCosts } from '@/lib/config'
import { createLogger } from '@shared/observability/logger'

const logger = createLogger({ operation: 'credits/packs' })

export async function GET() {
  try {
    return NextResponse.json({
      packs: getCreditPacks(),
      costs: getCreditCosts(),
    })
  } catch (error: unknown) {
    logger.error('Credits packs GET failed', error)
    return NextResponse.json({ error: 'Failed to load credit packs' }, { status: 500 })
  }
}
