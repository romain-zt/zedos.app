import { describe, it, expect } from 'vitest'
import {
  EXPRESS_BLOCKED_POST_PRD_SEGMENTS,
  isExpressBlockedPostPrdPath,
} from './express-post-prd-guard'

describe('isExpressBlockedPostPrdPath', () => {
  const projectId = 'proj-abc'

  it('blocks post-PRD segments under a project', () => {
    for (const segment of EXPRESS_BLOCKED_POST_PRD_SEGMENTS) {
      expect(
        isExpressBlockedPostPrdPath(`/dashboard/projects/${projectId}/${segment}`, projectId)
      ).toBe(true)
    }
  })

  it('does not block workspace root', () => {
    expect(isExpressBlockedPostPrdPath(`/dashboard/projects/${projectId}`, projectId)).toBe(false)
  })

  it('does not block unrelated projects', () => {
    expect(
      isExpressBlockedPostPrdPath('/dashboard/projects/other-id/feature-split', projectId)
    ).toBe(false)
  })
})
