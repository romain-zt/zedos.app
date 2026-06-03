import { AnalyticsEvents } from './analytics-events';
import { captureClient } from './posthog-client';

/** Toast/modal when an action is blocked for insufficient credits. */
export function captureCreditsDepletedSurface(
  surface: string,
  action: string,
  projectId?: string
): void {
  captureClient(AnalyticsEvents.CREDITS_DEPLETED_SURFACE_SHOWN, {
    surface,
    action,
    ...(projectId ? { project_id: projectId } : {}),
  });
}
