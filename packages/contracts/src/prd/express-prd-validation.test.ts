import { describe, it, expect } from 'vitest'
import { EXPRESS_PRD_SECTION_IDS } from './deliverable-kind'
import { parseExpressGeneratePrdAiResponse } from './express-prd-validation'

function expressSectionsPayload() {
  return {
    title: 'Express livrable',
    version_summary: 'Lean v1',
    sections: EXPRESS_PRD_SECTION_IDS.map((id) => ({
      id,
      title: id,
      content: `Content for ${id}`,
      confidence: 'high' as const,
      open_questions: [] as string[],
    })),
  }
}

describe('parseExpressGeneratePrdAiResponse', () => {
  it('accepts all 12 express section ids', () => {
    const result = parseExpressGeneratePrdAiResponse(expressSectionsPayload())
    expect(result.success).toBe(true)
  })

  it('rejects when an express section is missing', () => {
    const payload = expressSectionsPayload()
    payload.sections = payload.sections.filter((s) => s.id !== 'risks')
    const result = parseExpressGeneratePrdAiResponse(payload)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('risks')
    }
  })
})
