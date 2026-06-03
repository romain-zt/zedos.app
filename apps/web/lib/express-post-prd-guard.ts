import { redirect } from 'next/navigation'
import type { JourneyMode } from '@repo/contracts/project/project-contracts'

/** Post-PRD routes blocked while project stays in express journey mode. */
export const EXPRESS_BLOCKED_POST_PRD_SEGMENTS = [
  'feature-split',
  'user-stories',
  'task-split',
  'delivery',
] as const

export function isExpressBlockedPostPrdPath(pathWithoutLocale: string, projectId: string): boolean {
  const prefix = `/dashboard/projects/${projectId}/`
  if (!pathWithoutLocale.startsWith(prefix)) return false
  const rest = pathWithoutLocale.slice(prefix.length)
  const segment = rest.split('/')[0]
  return (EXPRESS_BLOCKED_POST_PRD_SEGMENTS as readonly string[]).includes(segment)
}

export function redirectIfExpressPostPrdBlocked(project: {
  id: string
  journeyMode: JourneyMode
}): void {
  if (project.journeyMode === 'express') {
    redirect(`/dashboard/projects/${project.id}`)
  }
}
