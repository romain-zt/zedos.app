import { describe, it, expect } from 'vitest'
import {
  buildClarifyMessages,
  buildClarifyMessagesFromClientThread,
  buildSessionStateBlock,
  normalizePrdSection,
} from '@/lib/clarify-prompt'

describe('normalizePrdSection', () => {
  it('maps vision/problem labels to Product Vision', () => {
    expect(normalizePrdSection('Product Vision & Problem Statement')).toBe('Product Vision')
  })

  it('keeps canonical names', () => {
    expect(normalizePrdSection('Core Features')).toBe('Core Features')
  })
})

describe('buildSessionStateBlock', () => {
  it('marks answered sections and picks next uncovered', () => {
    const block = buildSessionStateBlock([
      {
        structuredQuestion: 'What problem?',
        founderAnswer: 'CV creation is hard',
        prdImpact: 'Product Vision & Problem Statement',
      },
      {
        structuredQuestion: 'What inputs?',
        founderAnswer: null,
        prdImpact: 'Core Features',
      },
    ])
    expect(block).toContain('Product Vision')
    expect(block).toContain('CV creation is hard')
    expect(block).toContain('Next section to explore: Target Users')
    expect(block).toContain('Asked but not answered')
    expect(block).toContain('Core Features')
  })
})

describe('buildClarifyMessagesFromClientThread', () => {
  it('includes thread transcript and latest user message', () => {
    const messages = buildClarifyMessagesFromClientThread(
      { name: 'CV SaaS', description: null },
      [
        { role: 'user', content: 'User enters info' },
        { role: 'assistant', content: 'What risks?', reasoning: 'Need detail' },
      ],
      'Focus on ATS',
      'Open Questions'
    )
    expect(messages[1].content).toContain('THREAD')
    expect(messages[1].content).toContain('Founder: User enters info')
    expect(messages[1].content).toContain('Refine focus: Open Questions')
  })
})

describe('buildClarifyMessages', () => {
  it('uses a single user bundle instead of replaying full JSON turns', () => {
    const messages = buildClarifyMessages(
      { name: 'CV SaaS', description: 'Simple CV generator' },
      [
        {
          structuredQuestion: 'Main problem?',
          founderAnswer: 'Formatting pain',
          prdImpact: 'Product Vision',
        },
      ],
      'User enters info and picks a template'
    )
    expect(messages).toHaveLength(2)
    expect(messages[0].role).toBe('system')
    expect(messages[1].role).toBe('user')
    expect(messages[1].content).toContain('SESSION STATE')
    expect(messages[1].content).toContain('Founder message')
    expect(messages[1].content).not.toContain('decision_ui')
  })
})
