import { describe, it, expect } from 'vitest'
import { isExpressMinimumClarifyMet } from './express-clarify-prompt'
import type { ClarifyHistoryRow } from './clarify-prompt'

describe('isExpressMinimumClarifyMet', () => {
  it('returns false when no minimum sections are answered', () => {
    const history: ClarifyHistoryRow[] = [
      {
        structuredQuestion: 'What problem?',
        founderAnswer: 'Scheduling',
        prdImpact: 'User Journeys',
      },
    ]
    expect(isExpressMinimumClarifyMet(history)).toBe(false)
  })

  it('returns true when vision, users, and core features are answered', () => {
    const history: ClarifyHistoryRow[] = [
      {
        structuredQuestion: 'Vision?',
        founderAnswer: 'AI planner',
        prdImpact: 'Product Vision',
      },
      {
        structuredQuestion: 'Users?',
        founderAnswer: 'SMB founders',
        prdImpact: 'Target Users',
      },
      {
        structuredQuestion: 'Features?',
        founderAnswer: 'Import, clarify, export',
        prdImpact: 'Core Features',
      },
    ]
    expect(isExpressMinimumClarifyMet(history)).toBe(true)
  })

  it('ignores whitespace-only answers', () => {
    const history: ClarifyHistoryRow[] = [
      { structuredQuestion: 'V', founderAnswer: '   ', prdImpact: 'Product Vision' },
      { structuredQuestion: 'U', founderAnswer: 'Founders', prdImpact: 'Target Users' },
      { structuredQuestion: 'F', founderAnswer: 'Export', prdImpact: 'Core Features' },
    ]
    expect(isExpressMinimumClarifyMet(history)).toBe(false)
  })
})
