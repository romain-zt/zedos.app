export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getCreditPacks, getCreditCosts } from '@/lib/config'

export async function GET() {
  return NextResponse.json({
    packs: getCreditPacks(),
    costs: getCreditCosts(),
  })
}
