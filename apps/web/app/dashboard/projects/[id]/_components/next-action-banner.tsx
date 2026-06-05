'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useI18n } from '@/src/i18n';
import {
  deriveNextActionBannerState,
  type NextActionBannerCtaActionType,
  type NextActionBannerState,
} from '@domain/project-workspace';
import type { JourneyMode } from '@repo/contracts/project/project-contracts';
import { AnalyticsEvents } from '@infrastructure/analytics/analytics-events';
import { captureClient } from '@infrastructure/analytics/posthog-client';

type WorkspaceTab = 'clarify' | 'prd' | 'architecture' | 'history' | 'decisions';

interface NextActionBannerProps {
  readonly projectId: string;
  readonly journeyMode: JourneyMode;
  readonly prdVersionCount: number;
  readonly questionHistoryCount: number;
  readonly hasActiveShareLinkOnLatestPrd: boolean;
  readonly loading: boolean;
  readonly onSwitchTab: (tab: WorkspaceTab) => void;
  readonly onJourneyModeChange: (mode: JourneyMode) => void;
}

type CtaSlot = 'primary' | 'secondary';

export function NextActionBanner({
  projectId,
  journeyMode,
  prdVersionCount,
  questionHistoryCount,
  hasActiveShareLinkOnLatestPrd,
  loading,
  onSwitchTab,
  onJourneyModeChange,
}: NextActionBannerProps): JSX.Element | null {
  const router = useRouter();
  const { t } = useI18n();
  const lastShownStateRef = useRef<string | null>(null);

  const state = useMemo<NextActionBannerState | null>(
    () =>
      deriveNextActionBannerState({
        journeyMode,
        prdVersionCount,
        questionHistoryCount,
        hasActiveShareLinkOnLatestPrd,
        loading,
      }),
    [
      journeyMode,
      prdVersionCount,
      questionHistoryCount,
      hasActiveShareLinkOnLatestPrd,
      loading,
    ]
  );

  // Fire `next_action_banner_shown` only on actual state transitions to avoid
  // flooding analytics on each render. Resets when state becomes null.
  useEffect(() => {
    const stateId = state?.stateId ?? null;
    if (stateId === lastShownStateRef.current) return;
    lastShownStateRef.current = stateId;
    if (stateId === null) return;
    captureClient(AnalyticsEvents.NEXT_ACTION_BANNER_SHOWN, {
      project_id: projectId,
      state_id: stateId,
      journey_mode: journeyMode,
    });
  }, [state, projectId, journeyMode]);

  const switchToStandard = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/journey-mode`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ journeyMode: 'standard' }),
      });
      if (!res.ok) {
        toast.error(t('workspace.journeyModeUpdateFailed'));
        return;
      }
      onJourneyModeChange('standard');
      toast.success(t('workspace.journeyModeStandardActivated'));
    } catch {
      toast.error(t('workspace.journeyModeUpdateFailed'));
    }
  }, [projectId, onJourneyModeChange, t]);

  const handleCta = useCallback(
    (slot: CtaSlot, action: NextActionBannerCtaActionType): void => {
      if (!state) return;
      captureClient(AnalyticsEvents.NEXT_ACTION_BANNER_CTA_CLICKED, {
        project_id: projectId,
        state_id: state.stateId,
        cta: slot,
        action,
        journey_mode: journeyMode,
      });
      switch (action) {
        case 'switch-tab-clarify':
          onSwitchTab('clarify');
          return;
        case 'switch-tab-prd':
          onSwitchTab('prd');
          return;
        case 'navigate-delivery':
          router.push(`/dashboard/projects/${projectId}/delivery`);
          return;
        case 'switch-mode-standard':
          void switchToStandard();
          return;
      }
    },
    [state, projectId, journeyMode, onSwitchTab, router, switchToStandard]
  );

  if (!state) return null;

  const title = t(state.titleKey);
  const body = state.bodyKey ? t(state.bodyKey) : null;
  const primaryLabel = t(state.primary.labelKey);
  const secondaryLabel = state.secondary ? t(state.secondary.labelKey) : null;
  const showBody = body !== null && body !== state.bodyKey;

  return (
    <div
      role="region"
      aria-label={t('nextActionBanner.label')}
      data-testid="next-action-banner"
      data-state-id={state.stateId}
      className="sticky top-0 z-20 -mx-4 sm:-mx-0 sm:rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 shadow-sm backdrop-blur"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              <span className="text-primary">{t('nextActionBanner.label')}</span>{' '}
              {title}
            </p>
            {showBody && body !== null && (
              <p className="text-xs text-muted-foreground mt-0.5">{body}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 sm:justify-end flex-wrap">
          {state.secondary && secondaryLabel !== null && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                state.secondary && handleCta('secondary', state.secondary.action)
              }
            >
              {secondaryLabel}
            </Button>
          )}
          <Button
            variant="default"
            size="sm"
            onClick={() => handleCta('primary', state.primary.action)}
            className="gap-1"
          >
            {primaryLabel}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
