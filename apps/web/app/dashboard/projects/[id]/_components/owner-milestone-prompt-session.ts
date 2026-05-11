'use client'

/** One lightweight prompt per milestone + version per browser tab session (skip or submit still allowed later via server dedupe). */
export function milestonePromptSessionKey(
  projectId: string,
  milestoneType: string,
  prdVersionId: string | null | undefined
): string {
  return `zedos:milestonePrompt:${projectId}:${milestoneType}:${prdVersionId ?? '_'}`
}

export function hasSeenMilestonePromptThisSession(key: string): boolean {
  try {
    return typeof sessionStorage !== 'undefined' && sessionStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

export function markMilestonePromptSession(key: string): void {
  try {
    sessionStorage.setItem(key, '1')
  } catch {
    /* ignore quota / private mode */
  }
}
