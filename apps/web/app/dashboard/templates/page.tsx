'use client';

import { useCallback, useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FadeIn, Stagger, StaggerItem } from '@/components/ui/animate';
import { AlertTriangle, RefreshCw, LayoutGrid } from 'lucide-react';
import type { TemplateSlug, TemplateSummaryDTO } from '@repo/contracts/templates';
import { useI18n } from '@/src/i18n';
import { TemplateCard } from './_components/template-card';
import { TemplatePreviewModal } from './_components/template-preview-modal';

type ListState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'loaded'; templates: TemplateSummaryDTO[] };

export default function TemplatesPage() {
  const { tp, t } = useI18n();
  const [state, setState] = useState<ListState>({ kind: 'loading' });
  const [previewSlug, setPreviewSlug] = useState<TemplateSlug | null>(null);

  const fetchTemplates = useCallback(async () => {
    setState({ kind: 'loading' });
    try {
      const res = await fetch('/api/templates');
      if (!res.ok) {
        setState({
          kind: 'error',
          message: tp('loadFailed', 'Could not load templates'),
        });
        return;
      }
      const json: unknown = await res.json();
      const templates = Array.isArray(json) ? (json as TemplateSummaryDTO[]) : [];
      setState({ kind: 'loaded', templates });
    } catch {
      setState({
        kind: 'error',
        message: tp('networkError', 'Network error loading templates'),
      });
    }
  }, [tp]);

  useEffect(() => {
    void fetchTemplates();
  }, [fetchTemplates]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-3 sm:px-0">
      <FadeIn>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-primary">
            <LayoutGrid className="h-5 w-5" />
            <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
              {tp('title', 'Templates marketplace')}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {tp(
              'subtitle',
              'Start from a proven PRD structure instead of a blank doc. Preview a template, then use it to create a new project in one click.'
            )}
          </p>
        </div>
      </FadeIn>

      {state.kind === 'loading' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : state.kind === 'error' ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" aria-hidden />
          <AlertTitle className="text-base">
            {tp('loadFailedTitle', 'Catalog did not load')}
          </AlertTitle>
          <AlertDescription className="text-destructive-foreground/90 space-y-3">
            <p>{state.message}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-11 w-full border-destructive-foreground/40 sm:w-auto"
              onClick={() => void fetchTemplates()}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('common.retry')}
            </Button>
          </AlertDescription>
        </Alert>
      ) : state.templates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <LayoutGrid className="mb-4 h-10 w-10 text-muted-foreground/40" />
            <h3 className="font-display text-lg font-semibold">
              {tp('emptyTitle', 'No templates available yet')}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {tp(
                'emptyDescription',
                'Seed catalog is missing. Try refreshing — if the issue persists, the server is in maintenance.'
              )}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Stagger staggerDelay={0.05}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {state.templates.map((template) => (
              <StaggerItem key={template.slug}>
                <TemplateCard template={template} onPreview={setPreviewSlug} />
              </StaggerItem>
            ))}
          </div>
        </Stagger>
      )}

      <TemplatePreviewModal slug={previewSlug} onClose={() => setPreviewSlug(null)} />
    </div>
  );
}
